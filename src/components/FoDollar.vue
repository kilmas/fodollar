<template>
  <div>
    <b-navbar toggleable="md" class="navbar-light bg-light">
      <b-navbar-toggle target="nav_collapse"></b-navbar-toggle>
      <b-navbar-brand href="#">福刀福到 有fo马上就有刀！</b-navbar-brand>
      <b-navbar-brand>
        <span
          class="fa fa-share"
          v-clipboard:copy="copyData"
          v-clipboard:success="onCopy"
          v-clipboard:error="onError"
        ></span>
      </b-navbar-brand>
      <b-collapse is-nav id="nav_collapse">
        <b-navbar-nav>
          <b-nav-item @click.prevent="showRule">Rule</b-nav-item>
          <!-- <b-nav-item @click.prevent="setEmail">设置通知邮件</b-nav-item> -->
        </b-navbar-nav>
        <b-navbar-nav class="ml-auto">
          <b-nav-item-dropdown text="Lang" right>
            <b-dropdown-item href="#">EN</b-dropdown-item>
            <b-dropdown-item href="#">CN</b-dropdown-item>
          </b-nav-item-dropdown>
          <b-nav-item-dropdown right v-if="account.name">
            <!-- Using button-content slot -->
            <template slot="button-content">
              <em>{{ account.name ? account.name : "" }}</em>
            </template>
            <b-dropdown-item @click.prevent="signout">Sign out</b-dropdown-item>
          </b-nav-item-dropdown>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
    <main class="column">
      <div class="d-flex justify-content-center" style="min-height: 500px">
        <b-tabs
          card
          content-class=""
          body-class="p-1"
          nav-class="md-tab"
          class="col-12 col-sm-12 col-md-8 col-lg-6 pr-0 pl-0"
        >
          <b-tab title="获取FD" active>
            <div class="mb-2 pt-2">
              <b-alert show> 当前FO价格:{{ foPrice.toFixed(6) }} USDT</b-alert>
              <b-alert show>
                Balance:{{ myFD.balance.quantity }}
                {{ myFO.balance.quantity }}</b-alert
              >
              <b-input-group size="md" prepend="FO" append="抵押率">
                <b-form-input
                  v-model="mintAmount"
                  minValue="10000"
                  type="number"
                  @focus="onMintAmount"
                ></b-form-input>
                <b-form-select
                  v-model="mintRate"
                  :options="mintRates"
                ></b-form-select>
              </b-input-group>
              <b-input-group size="md" class="mt-2" prepend="FD">
                <b-form-input
                  type="number"
                  v-model="mintValue"
                  @focus="onMintValue"
                ></b-form-input>
                <b-input-group-append>
                  <b-button size="sm" @click="mintFD" variant="primary"
                    >≈抵押获取</b-button
                  >
                </b-input-group-append>
              </b-input-group>
            </div>
          </b-tab>
          <b-tab title="返还/增押">
            <div class="mb-2 pt-2">
              <b-alert show variant="primary">你的抵押列表</b-alert>
              <b-list-group>
                <b-list-group-item
                  v-for="item in myMints"
                  :key="item.id"
                  class="flex-column align-items-start"
                >
                  <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">{{ item.value }}</h6>
                    <small>抵押{{ item.amount }}</small>
                  </div>
                  <p class="mb-1">
                    抵押时间:{{
                      moment(item.time / 1000).format("YYYY/MM/DD HH:mm:ss")
                    }}
                  </p>
                  <p class="mb-1">
                    抵押率:{{ (item.realRate * 100).toFixed(2) }}%
                    <b-badge variant="info" pill v-if="item.realRate < 1.8"
                      >需增押</b-badge
                    >
                    <b-badge variant="warning" pill v-if="item.status === '1'"
                      >被锁定</b-badge
                    >
                    <b-badge
                      variant="danger"
                      pill
                      v-if="item.realRate < clearRate"
                      >会被清算</b-badge
                    >
                  </p>
                  <b-input-group size="md" class="mt-2 mb-2" prepend="FO">
                    <b-form-input
                      v-model="item.feedValue"
                      type="number"
                    ></b-form-input>
                    <b-input-group-append>
                      <b-button
                        size="sm"
                        @click="feedFD(item)"
                        variant="primary"
                        >增加抵押</b-button
                      >
                    </b-input-group-append>
                  </b-input-group>
                  <b-button
                    size="sm"
                    block
                    @click="returnFD(item)"
                    variant="primary"
                    >返还</b-button
                  >
                </b-list-group-item>
              </b-list-group>
            </div>
            <div class="mb-2 pt-2">
              <b-alert show="!!myCMints.length" variant="primary">你的已被清算列表</b-alert>
              <b-list-group>
                <b-list-group-item
                  v-for="item in myCMints"
                  :key="item.id"
                  class="flex-column align-items-start"
                >
                  <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">{{ item.value }}</h6>
                    <small>抵押{{ item.amount }}</small>
                  </div>
                  <p class="mb-1">
                    清算时间:{{
                      moment(item.time / 1000).format("YYYY/MM/DD HH:mm:ss")
                    }}
                  </p>
                  <b-button
                    size="sm"
                    block
                    @click="returnUSDT(item)"
                    variant="primary"
                    >返还USDT</b-button
                  >
                </b-list-group-item>
              </b-list-group>
            </div>
          </b-tab>
          <b-tab title="锁定/清算">
            <div class="mb-2 pt-2">
              <b-alert show variant="primary">可锁定清算列表</b-alert>
              <b-list-group>
                <b-list-group-item
                  v-for="item in auctionMints"
                  :key="item.id"
                  class="flex-column align-items-start"
                >
                  <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">{{ item.value }}</h6>
                    <small>抵押{{ item.amount }}</small>
                  </div>
                  <p class="mb-1">
                    抵押率:{{ (item.realRate * 100).toFixed(2) }}
                    %
                    <b-badge
                      :variant="
                        item.realRate < clearRate ? 'danger' : 'warning'
                      "
                      pill
                      v-if="item.ctime"
                      >低于150%会被清算</b-badge
                    >
                  </p>
                  <p class="mb-1" v-if="item.ctime">
                    锁定时间:{{
                      moment(item.ctime / 1000).format("YYYY/MM/DD HH:mm:ss")
                    }}
                  </p>
                  <b-button
                    size="sm"
                    block
                    @click="auctionLock(item.id)"
                    variant="primary"
                    v-if="!item.ctime && item.realRate < lockRate"
                    >锁定</b-button
                  >
                  <b-button
                    size="sm"
                    block
                    @click="clearFD(item)"
                    variant="primary"
                    v-if="item.ctime"
                    :disabled="item.realRate >= clearRate || !!item.clearTime"
                  >
                    {{
                      !!item.clearTime
                        ? "清算倒计时"
                        : `支付 ${item.value.split(" ")[0]} FOUSDT 清算`
                    }}
                    {{ item.clearTime ? item.clearTime : "" }}</b-button
                  >
                </b-list-group-item>
              </b-list-group>
            </div>
          </b-tab>
          <b-tab title="USDT">
            <div class="mb-2 pt-2">
              <b-alert show variant="primary">FD兑换-->波场 TRC-USDT,直接波场USDT由转账到你的TRC-20地址,扣除0.1USDT手续费</b-alert>
              <b-alert show>波场账号余额: {{ trxUsdt }} USDT, 如需及时到账金额请小于该余额，可自动转账</b-alert>
              <b-input-group size="sm" append="FD->USDT" :prepend="`余额:${myFD.balance.quantity}`">
                <b-form-input v-model="swapFDAmount" type="number" min="10" placeholder="提现金额"></b-form-input>
              </b-input-group>
              <b-input-group class="mt-3" size="sm" append="">
                <b-form-input v-model="cexAccount" size="sm" placeholder="交易所充值trc-usdt/波场地址(T开头"></b-form-input>
                <b-input-group-append>
                  <b-button size="sm" variant="primary" @click="outToUSDT">获取</b-button>
                </b-input-group-append>
              </b-input-group>
            </div>
            <div class="mb-2 pt-2">
              <b-alert show variant="primary">你的兑换列表</b-alert>
              <b-list-group>
                <b-list-group-item
                  v-for="item in myFDWds"
                  :key="item.id"
                  class="flex-column align-items-start"
                >
                  <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">ID:{{item.id}}｜金额:{{ item.amount }}</h6>
                    <small>状态:{{ item.wdid === '0000000000000000000000000000000000000000000000000000000000000000' ? '未转账': '已转账'}}</small>
                  </div>
                  <p class="mb-1">
                    兑换时间:{{
                      moment(item.time / 1000).format("YYYY/MM/DD HH:mm:ss")
                    }}
                  </p>
                  <b-button
                    size="sm"
                    block
                    @click="getFDByUSDT(item)"
                    variant="primary"
                    :disabled="item.wdid === '0000000000000000000000000000000000000000000000000000000000000000'"
                    >链上还USDT返回FD</b-button
                  >
                  <div>
                  <h6 class="mt-1">链外还USDT返回FD</h6>
                  <!-- Using modifiers -->
                  <b-button size="sm" variant="info" v-b-toggle.collapse-1 class="m-1">Okex内部转账还款</b-button>

                  <!-- Using value -->
                  <b-button size="sm" variant="info" v-b-toggle="'collapse-2'" class="m-1">币安链memo提现还款</b-button>

                  <!-- Element to collapse -->
                  <b-collapse id="collapse-1" accordion="my-accordion">
                    <b-card>
                      <b-alert show variant="primary">okex内部转账到：{{Number(item.amount.split(' ')[0]).toFixed(3)}}{{`${item.id}`.padStart(5, '0')}} USDT 到 fd@qingah.com</b-alert>
                      <b-alert show variant="danger">转账金额小数点后5位为你的还款ID，okex内部转账务必确认小数点后面还款ID，否则链外还FD无法生效</b-alert>
                      <b-input-group size="md" prepend="To okex">
                        <b-form-input v-model="copyAccount" disabled></b-form-input>
                        <b-input-group-append>
                          <b-button variant="primary" size="sm" v-clipboard:copy="copyAccount" v-clipboard:success="onCopyAccount" v-clipboard:error="onError">复制该账号</b-button>
                        </b-input-group-append>
                      </b-input-group>
                      <b-input-group size="md" class="mt-2" prepend="USDT">
                        <b-form-input :value="`${Number(item.amount.split(' ')[0]).toFixed(3)}${String(item.id).padStart(5, '0')}`" disabled></b-form-input>
                        <b-input-group-append>
                          <!-- <b-button size="sm" variant="danger" v-clipboard:copy="item.id" v-clipboard:success="onCopyID" v-clipboard:error="onError">.{{ accountID }}</b-button> -->
                          <b-button size="sm" variant="primary" v-clipboard:copy="`${Number(item.amount.split(' ')[0]).toFixed(3)}${String(item.id).padStart(5, '0')}`" v-clipboard:success="onCopyAmount" v-clipboard:error="onError">复制该金额</b-button>
                        </b-input-group-append>
                      </b-input-group>
                    </b-card>
                  </b-collapse>
                  <b-collapse id="collapse-2" accordion="my-accordion">
                    <b-card>
                      <b-alert show>币安直接提币到币安链以下账号，memo务必填写该订单ID：{{ item.id }}</b-alert>
                      <b-input-group size="sm">
                        <b-form-input size="sm" v-model="copyBNAddress" disabled></b-form-input>
                        <b-input-group-append>
                          <b-button variant="primary" size="sm" v-clipboard:copy="copyBNAddress" v-clipboard:success="onCopyAccount" v-clipboard:error="onError">复制</b-button>
                        </b-input-group-append>
                      </b-input-group>
                      <b-input-group size="sm" class="mt-2" prepend="USDT">
                        <b-form-input size="sm" :value="`${item.amount.split(' ')[0]}`" disabled></b-form-input>
                        <b-input-group-append>
                          <b-button size="sm" variant="primary" v-clipboard:copy="`${item.amount.split(' ')[0]}`" v-clipboard:success="onCopyAmount" v-clipboard:error="onError">复制金额</b-button>
                        </b-input-group-append>
                      </b-input-group>
                      <b-input-group size="sm" class="mt-2" prepend="memo">
                        <b-form-input size="sm" :value="`${item.id}`" disabled></b-form-input>
                        <b-input-group-append>
                          <b-button size="sm" variant="primary" v-clipboard:copy="`${item.id}`" v-clipboard:success="onCopyAmount" v-clipboard:error="onError">复制ID</b-button>
                        </b-input-group-append>
                      </b-input-group>
                    </b-card>
                  </b-collapse>
                </div>
                </b-list-group-item>
              </b-list-group>
            </div>
          </b-tab>
        </b-tabs>
      </div>
      <footer class="d-flex justify-content-center">
        <p>
          问题或反馈(额度需求:<a href="mailto:fd@qingah.com"
            >fd@qingah.com</a
          >
        </p>
      </footer>
    </main>
    <b-modal
      v-model="tranHash"
      centered
      :hide-header="!tranTitle"
      :title="tranTitle"
      hide-footer
    >
      <div :class="tranText" style="word-wrap: break-word">{{ tranMsg }}</div>
    </b-modal>
    <b-modal
      id="bv-modal-example"
      centered
      hide-footer
      hide-header
      v-model="showMsg"
    >
      <div class="d-block text-center">
        <h3>{{ modalMsg }}</h3>
      </div>
      <b-button class="mt-3" block @click="showMsg = false">确定</b-button>
    </b-modal>
    <b-modal
      v-model="buttonSpiner"
      centered
      hide-footer
      hide-header-close
      hide-header
      no-close-on-backdrop
      hide-backdrop
      content-class="hide-modal-content"
    >
      <div class="text-center">
        <b-spinner large />
      </div>
    </b-modal>
    <b-modal v-model="ruleShow" @ok="handleOk" centered>
      <b-list-group class="text-danger">
        <b-list-group-item
          >1.抵押FO出FD，理论上根据链上FO/FOUSDT价格，抵押出1FD等于1USDT</b-list-group-item
        >
        <b-list-group-item
          >2.抵押率200%+，抵押率低于160%会被锁定，抵押率低于150%的订单，北京时间8-24时，被锁定订单且超过1小时（北京时间0-8时，被锁定订单且超过8小时），可以使用相应的USDT进行清算订单</b-list-group-item
        >
        <b-list-group-item
          >3.抵押订单的用户可以根据需要，增加订单的FO抵押防止被锁定或清算，或打回相应的FD返回该订单的FO和销毁相应的FD</b-list-group-item
        >
        <b-list-group-item
          >4.用户被清算的订单，可以根据需要，用户使用相应的FD通过合约返回相等USDT</b-list-group-item
        >
        <b-list-group-item
          >5.抵押订单最长1年，超过一年的订单可被相应USDT清算</b-list-group-item
        >
        <b-list-group-item
          >6.FD 可在foctc
          出金成为USDT，也可以通过foctc返回相应的提现单FD</b-list-group-item
        >
      </b-list-group>
    </b-modal>
  </div>
</template>

<script>
import axios from "axios";
import lodashGet from "lodash/get";
const Fo = require("fibos.js");

import Vue from "vue";
import VueClipboard from "vue-clipboard2";
import forge from "node-forge";
Vue.use(VueClipboard);
const moment = require("moment");
const Base64 = require("js-base64").Base64;

const foMainChain =
  "6aa7bd33b6b45192465afa3553dedb531acaaff8928cf64b70bd4c5e49b7ec6a";
const foTestChain =
  "68cee14f598d88d340b50940b6ddfba28c444b46cd5f33201ace82c78896793a";

const CONTRACT = "fdisfodollar";
const FOCTC = "foaccountids";
const rsaPublicKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDtf6zwW78U3O1SkqqPnrPWt1rn
ab+odxzSOV8wom1dT6j9ccj9wwoNO6E5MwsjWQjH4F7uLIFoZvSOtllxROGkbMqb
MmbdNLJHDNXBLhUfS8rJHowyc8XxZrvFgCA+B2JkCJpsD0bo3VPCHwwKKijzfZOm
aUmbIk/O6hZpgEwiMQIDAQAB
-----END PUBLIC KEY-----`;

const pKeyEncrypt = forge.pki.publicKeyFromPem(rsaPublicKey);

export default {
  name: CONTRACT,
  mounted() {
    // document.title = ''
    if (this.$route.query.debug == "fo") {
      this.selectNet = "foTest";
    }
    const foNetwork = this.network[this.selectNet];
    this.fo = Fo({
      chainId: this.chains[this.selectNet],
      httpEndpoint: `${location.protocol}//${foNetwork.reqHost}:${
        location.protocol === "http:" ? foNetwork.port : foNetwork.reqPost
      }`,
    });
    this.fomain = Fo({
      chainId: this.chains["foMain"],
      httpEndpoint: `http://rpc-mainnet.bitewd.com:80`,
    });
    this.getTrxUsdt();
    this.getfoPrice();
    this.getMints();
    this.initIronman();
    setInterval(() => {
      const curnnetTime = new Date().getTime();
      this.auctionMints.forEach((item, index) => {
        let clearTime = 0;
        if (item.status === "1" && item.realRate < this.clearRate) {
          const dftime = curnnetTime - item.ctime / 1000;
          const hour = ((curnnetTime / 1000) % (3600 * 24)) / 3600;
          if (hour > 16 && hour <= 24) {
            clearTime = 3600000 * 8 - dftime;
          } else {
            clearTime = 3600000 - dftime;
          }
          if (clearTime > 0) {
            clearTime = moment.utc(clearTime).format("HH:mm:ss");
          } else {
            clearTime = 0;
          }
        }
        // console.log(clearTime)
        this.$set(this.auctionMints, index, {
          ...item,
          clearTime,
        });
      });
    }, 1000);
  },
  computed: {},
  created() {
    //页面刚进入时开启长连接
  },
  destroyed() {
    //页面销毁时关闭长连接
  },
  data() {
    return {
      contractName: CONTRACT,
      fopairPrimary: 0,
      loanRate: 0.0004,
      lockRate: 1.6,
      clearRate: 1.5,
      foPrice: 0,
      trxUsdt: "",
      showTab: 1,
      tabTokens: { FO: 4, FOUSDT: 6, FODAI: 8, FOETH: 8, FOUSDK: 6 },
      account: {},
      ruleShow: false,
      tranHash: false,
      tranTitle: "",
      tranMsg: "",
      mintValue: 0,
      tranText: "text-success",
      tokens: [
        { text: "FO", value: "FO" },
        { text: "FOUSDT", value: "FOUSDT" },
        { text: "FODAI", value: "FODAI" },
        { text: "FOETH", value: "FOETH" },
        { text: "FOUSDK", value: "FOUSDK" },
      ],
      mintRate: 2,
      myFD: {
        balance: {
          quantity: "",
        },
      },
      myFO: {
        balance: {
          quantity: "",
        },
      },
      myMints: [],
      mintRates: [
        { text: "200%", value: 2 },
        { text: "250%", value: 2.5 },
        { text: "400%", value: 4.0 },
        { text: "500%", value: 5 },
      ],
      selectNet: "foMain",
      chains: {
        foTest: foTestChain,
        foMain: foMainChain,
      },
      network: {
        foTest: {
          name: "FO test",
          protocol: "http",
          port: 80,
          reqPost: 80,
          host: "api.testnet.fo",
          reqHost: "api.testnet.fo",
          blockchain: "fibos",
          chainId: foTestChain,
          backupServer: "",
          http: "http",
          ticketUrl: "",
        },
        foMain: {
          name: "FIBOS Mainnet",
          protocol: "http",
          reqPost: 443,
          blockchain: "fibos",
          chainId: foMainChain,
          host: "to-rpc.fibos.io",
          reqHost: "rpc-mainnet.bitewd.com",
          port: 8870,
          backupServer: "",
          http: "http",
          ticketUrl: "https://api.aex.plus",
        },
      },
      copyData: "https://fd.qingah.com",
      copyAmount: "10",
      copyAccount: "fd@qingah.com",
      copyBNAddress: "bnb144y5kxf3rwkkrem6zhvgcu95eneuwxwpwrzsa3",
      myBalance: [],
      buttonSpiner: false,
      showMsg: false,
      modalMsg: "",
      mintAmount: 10000,
      fdAmount: "",
      cexAccount: "",
      selected: "FO",
      auctionMints: [],
      myCMints: [],
      myFDWds: [],
      swapFDAmount: 0,
    };
  },
  methods: {
    qrAccount(item) {
      return item.type === 2 ? item.buyer : item.seller;
    },
    handleOk() {},
    setEmail() {},
    onMintAmount() {
      this.mintfocus = 1;
    },
    onMintValue() {
      this.mintfocus = 2;
    },
    tranModal(show, msg, text, title) {
      if (msg) {
        this.tranMsg = msg;
      }
      if (title) {
        this.tranTitle = title;
      } else {
        this.tranTitle = "";
      }
      if (text) {
        this.tranText = text;
      }
      this.tranHash = show;
    },
    reflesh() {
      this.getMyMints();
      this.getMints();
      this.getMyCMints();
      this.getMyBalance();
      this.getMyFDWds()
    },
    errMsg(e) {
      return typeof e === "string"
        ? lodashGet(e.match(/Error: ([\S\s]*?)at/), "[1]", e)
        : JSON.stringify(e);
    },
    async mintFD() {
      this.buttonSpiner = true;
      try {
        const trx = await this.fo.transfer(
          this.account.name,
          CONTRACT,
          `${Number(this.mintAmount).toFixed(this.tabTokens[this.selected])} ${
            this.selected
          }`,
          `1,${this.mintRate},${this.foPrice.toFixed(6)}`
        );
        this.tranModal(true, "抵押成功！", "text-success");
        console.log(trx);
      } catch (e) {
        this.tranModal(true, this.errMsg(e), "text-danger", "抵押失败！");
      }
      this.reflesh();
      this.buttonSpiner = false;
    },
    async clearFD(item) {
      this.buttonSpiner = true;
      try {
        const trx = await this.fo.transfer(
          this.account.name,
          CONTRACT,
          `${item.value.split(" ")[0]} FOUSDT`,
          `4,${item.id}`
        );
        this.tranModal(true, "清算成功！", "text-success");
        console.log(trx);
      } catch (e) {
        this.tranModal(true, this.errMsg(e), "text-danger", "清算失败！");
      }
      this.reflesh();
      this.buttonSpiner = false;
    },
    async feedFD(item) {
      this.buttonSpiner = true;
      try {
        const trx = await this.fo.transfer(
          this.account.name,
          CONTRACT,
          `${Number(item.feedValue).toFixed(this.tabTokens[this.selected])} ${
            this.selected
          }`,
          `3,${item.id}`
        );
        this.tranModal(true, "增押成功！", "text-success");
        console.log(trx);
      } catch (e) {
        this.tranModal(true, this.errMsg(e), "text-danger", "增押失败！");
      }
      this.reflesh();
      this.buttonSpiner = false;
    },
    async returnFD(item) {
      this.buttonSpiner = true;
      try {
        const contract = await this.fo.contract("eosio.token", {
          requiredFields: this.requiredFields,
        });
        const trx = await contract.extransfer(
          this.account.name,
          CONTRACT,
          `${item.value}@${CONTRACT}`,
          `2,${item.id}`,
          {
            authorization: `${this.account.name}@active`,
          }
        );
        this.tranModal(true, "返还成功", "text-success");
        console.log(trx);
      } catch (e) {
        this.tranModal(true, this.errMsg(e), "text-danger", "返还失败");
      }
      this.reflesh();
      this.buttonSpiner = false;
    },
    async returnUSDT(item) {
      this.buttonSpiner = true;
      try {
        const contract = await this.fo.contract("eosio.token", {
          requiredFields: this.requiredFields,
        });
        const trx = await contract.extransfer(
          this.account.name,
          CONTRACT,
          `${item.value}@${CONTRACT}`,
          `5,${item.id}`,
          {
            authorization: `${this.account.name}@active`,
          }
        );
        this.tranModal(true, "返还USDT成功", "text-success");
        console.log(trx);
      } catch (e) {
        this.tranModal(true, this.errMsg(e), "text-danger", "返还USDT失败");
      }
      this.reflesh();
      this.buttonSpiner = false;
    },
    async auctionLock(id) {
      this.buttonSpiner = true;
      try {
        const contract = await this.fo.contract(CONTRACT, {
          requiredFields: this.requiredFields,
        });
        const trx = await contract.lock(id, {
          authorization: `${this.account.name}@active`,
        });
        this.tranModal(true, "锁定成功！", "text-success");
        console.log(trx);
      } catch (e) {
        this.tranModal(true, this.errMsg(e), "text-danger", "锁定失败！");
      }
      this.reflesh();
      this.buttonSpiner = false;
    },
    async outToUSDT() {
      if (!this.cexAccount || this.cexAccount.length !== 34 || this.cexAccount[0] !== 'T') {
        this.tranModal(true, '请输入(波场trx账号', 'text-danger')
        return
      }
      await this.getTrxUsdt()
      // if (Number(this.trxUsdt) < Number(this.swapFDAmount)) {
      //   this.tranModal(true, '额度不够，请等候或邮件联系', 'text-danger')
      //   return
      // }

      this.buttonSpiner = true
      const memo = pKeyEncrypt.encrypt(this.cexAccount.trim(), 'RSA-OAEP')
      try {
        const contract = await this.fo.contract("eosio.token", {
          requiredFields: this.requiredFields,
        });
        const trx = await contract.extransfer(
          this.account.name,
          FOCTC,
          `${(Number(this.swapFDAmount)).toFixed(6)} FD@${CONTRACT}`,
          btoa(memo),
          {
            authorization: `${this.account.name}@active`,
          }
        );
        this.tranModal(true, '确认成功，订单转账成功！', 'text-success')
        console.log(trx)
      } catch (e) {
        this.tranModal(true, this.errMsg(e), "text-danger", "转换失败！");
      }
      this.reflesh()
      this.buttonSpiner = false
    },
    async getFDByUSDT(item) {
      this.buttonSpiner = true;
      try {
        const trx = await this.fo.transfer(
          this.account.name,
          FOCTC,
          `${item.amount.split(' ')[0]} FOUSDT`,
          `1,${item.id}`
        );
        this.tranModal(true, "返回成功！", "text-success");
        console.log(trx);
      } catch (e) {
        this.tranModal(true, this.errMsg(e), "text-danger", "返回失败！");
      }
      this.reflesh();
      this.buttonSpiner = false;
    },
    async getTrxUsdt() {
      const res = await axios.get(
        "https://apilist.tronscan.io/api/account?address=TUBMNBBsAMvPZLSiYeZoQ5MtJNARBb8v9D"
      );
      this.trxUsdt =
        res.data.trc20token_balances.find(
          (item) => item.tokenId === "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
        ).balance /
        10 ** 6;
    },
    onCopy(e) {
      if (e.action === "copy") {
        this.tranModal(true, "复制成功：" + e.text, "text-success");
      }
    },
    onError(e) {
      console.log(e);
    },
    async getAccount(account = CONTRACT) {
      let token;
      try {
        token = await this.fo.getAccount(account);
      } catch (e) {
        return null;
      }
      return token;
    },
    async getBalance(account = CONTRACT) {
      let token;
      try {
        token = await this.fo.getTableRows(
          true,
          "eosio.token",
          account,
          "accounts",
          "primary",
          0,
          100,
          100
        );
      } catch (e) {
        return null;
      }
      return token.rows;
    },
    async getMyMints(account = CONTRACT) {
      let token;
      try {
        token = await this.fo.getTableRows(
          true,
          account,
          account,
          "mints",
          "id",
          this.account.name,
          this.account.name,
          100,
          "i64",
          "2"
        );
      } catch (e) {
        return null;
      }
      this.myMints = token.rows.map((item) => {
        const feedValue = Math.ceil(
          (Number(item.value.split(" ")[0]) * 2) / this.foPrice -
            Number(item.amount.split(" ")[0])
        );
        return {
          ...item,
          feedValue: feedValue > 0 ? feedValue : 0,
          realRate:
            (item.amount.split(" ")[0] * this.foPrice) /
            item.value.split(" ")[0],
        };
      });
      return token.rows;
    },
    async getMyCMints(account = CONTRACT) {
      let token;
      try {
        token = await this.fo.getTableRows(
          true,
          account,
          account,
          "cmints",
          "id",
          this.account.name,
          this.account.name,
          100,
          "i64",
          "2"
        );
      } catch (e) {
        return null;
      }
      this.myCMints = token.rows;
      return token.rows;
    },
    async getMints(account = CONTRACT) {
      let token;
      try {
        token = await this.fo.getTableRows(
          true,
          account,
          account,
          "mints",
          "id",
          "",
          "",
          100,
          "i64",
          "1"
        );
      } catch (e) {
        return null;
      }
      this.auctionMints = token.rows.filter((item) => {
        if (item.account === this.account.name) return false;
        const realRate =
          (item.amount.split(" ")[0] * this.foPrice) / item.value.split(" ")[0];
        if (realRate >= this.lockRate) return false;
        item.realRate = realRate;
        return true;
      });
      return token.rows;
    },
    async getMyFDWds() {
      let token;
      try {
        token = await this.fo.getTableRows(
          true,
          FOCTC,
          FOCTC,
          "fdwds",
          "account",
          this.account.name,
          this.account.name,
          100,
          "i64",
          "2"
        );
      } catch (e) {
        return null;
      }
      this.myFDWds = token.rows;
      return token.rows;
    },
    login() {
      this.reqIronman();
    },
    signout() {
      this.account = {};
      this.ironman.forgetIdentity(this.ironman.identity);
    },
    showRule() {
      this.ruleShow = true;
    },
    async getfoPrice() {
      let swapmarket;
      try {
        swapmarket = await this.fomain.getTableRows(
          true,
          "eosio.token",
          "eosio.token",
          "swapmarket",
          "",
          "0",
          "1",
          1
        );
      } catch (e) {
        return null;
      }
      const {
        tokenx: { quantity: quantityx },
        tokeny: { quantity: quantityy },
      } = swapmarket.rows[0];
      const usdtprice = Number(quantityx.split(" ")[0]);
      const foprice = Number(quantityy.split(" ")[0]);
      this.foPrice = usdtprice / foprice;
      this.mintValue = (
        (this.mintAmount * this.foPrice) /
        this.mintRate
      ).toFixed(6);
      return swapmarket.rows[0];
    },
    async getMyBalance() {
      this.contractBalance = await this.getBalance(this.account.name);
      if (this.contractBalance) {
        const myFD = this.contractBalance.find(
          (e) =>
            e.balance.contract === CONTRACT &&
            e.balance.quantity.split(" ")[1] == "FD"
        );
        if (myFD) {
          this.myFD = myFD;
          this.swapFDAmount = myFD.balance.quantity.split(' ')[0]
        }
        const myFO = this.contractBalance.find(
          (e) => e.balance.quantity.split(" ")[1] == "FO"
        );
        if (myFO) {
          this.myFO = myFO;
        }
      }
    },
    onCopy(e) {
      if (e.action === 'copy') {
        this.tranModal(true, '复制成功：' + e.text, 'text-success')
      }
    },
    onCopyID(e) {
      if (e.action === 'copy') {
        this.tranModal(true, '复制成功：' + e.text, 'text-success')
      }
    },
    onCopyAccount(e) {
      if (e.action === 'copy') {
        this.tranModal(true, '复制成功：' + e.text, 'text-success')
      }
    },
    onCopyAmount(e) {
      // if (this.accountID === '') {
      //   this.tranModal(true, '你未设置ID,请勿转账!', 'text-warning')
      //   return
      // }
      if (e.action === 'copy') {
        this.tranModal(true, '复制成功：' + e.text, 'text-success')
      }
    },
    initIronman() {
      console.log("init Ironman");
      document.addEventListener("ironmanLoaded", () => {
        // window.ironman.fo = window.ironman.eos;
        this.ironman = window.ironman;
        // If you want to require a specific version of Scatter
        this.reqIronman();
      });
    },
    async reqIronman() {
      const ironman = this.ironman;
      const foNetwork = this.network[this.selectNet];

      const RequirefoNetwork = {
        blockchain: foNetwork.blockchain,
        chainId: this.chains[this.selectNet],
        host: foNetwork.host,
        port: foNetwork.reqPost,
        protocol: foNetwork.http,
      };

      try {
        const identity = await ironman.getIdentity({
          accounts: [RequirefoNetwork],
        });
        const account = identity.accounts.find(
          (acc) => acc.blockchain === foNetwork.blockchain
        );
        // FO参数
        const foOptions = {
          broadcast: true,
          chainId: this.chains[this.selectNet],
        };
        //获取FO instance
        if (this.selectNet === "foMain") {
          if (location.protocol === "https:") {
            foNetwork.host = foNetwork.reqHost;
            foNetwork.port = 443;
            foNetwork.protocol = "https";
          } else {
            foNetwork.host = foNetwork.reqHost;
            foNetwork.port = 80;
            foNetwork.protocol = "http";
          }
        }
        const fo = ironman.fibos(foNetwork, Fo, foOptions, foNetwork.protocol);
        const requiredFields = {
          accounts: [foNetwork],
        };

        this.fo = fo;
        this.requiredFields = requiredFields;

        if (this.$route.query.account) {
          account.name = this.$route.query.account;
        }
        this.account = account;
        this.getMyBalance();
        this.getMyMints();
        this.getMyCMints();
        this.getMyFDWds()
      } catch (e) {
        console.log("error", e);
      }
    },
    showModal(msg) {
      this.showMsg = true;
      this.modalMsg = msg;
    },
    moment,
    acctDecode: Base64.decode,
  },
  watch: {
    mintAmount(newVal) {
      if (this.mintfocus === 1 && newVal) {
        this.mintValue = ((newVal * this.foPrice) / this.mintRate).toFixed(6);
      }
    },
    mintValue(newVal) {
      if (this.mintfocus === 2 && newVal) {
        this.mintAmount = ((newVal / this.foPrice) * this.mintRate).toFixed(4);
      }
    },
    mintRate(newVal) {
      if (newVal) {
        this.mintValue = ((this.mintAmount * this.foPrice) / newVal).toFixed(6);
      }
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
.card-body {
  padding: 0.25em;
}
.md-tab {
  font-size: 14px;
}
.small-tab {
  font-size: 12px;
}
.flex-row-center {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
.flex-center {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
.hide-modal-content {
  background-color: transparent;
  background-clip: none;
  border: none;
}
</style>
