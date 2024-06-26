/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 4047:
/***/ ((__unused_webpack___webpack_module__, __unused_webpack___webpack_exports__, __webpack_require__) => {

/* harmony import */ var viem__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7246);
/* harmony import */ var viem__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(5229);
/* harmony import */ var viem__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(9625);
/* harmony import */ var viem__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(1803);
/* harmony import */ var viem__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(9028);
/* harmony import */ var viem__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(3980);
/* harmony import */ var viem__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(8776);
/* harmony import */ var viem__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(1677);
/* harmony import */ var viem__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(7759);
/* harmony import */ var viem__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(8541);
/* harmony import */ var viem_chains__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3210);
/* harmony import */ var viem_chains__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6900);
// Copyright (C) 2024 halys




const chain = viem_chains__WEBPACK_IMPORTED_MODULE_0__/* .arbitrum */ .y
const ricoName = 'Kola'

let bankAddr, ricoAddr, riskAddr

if (chain === viem_chains__WEBPACK_IMPORTED_MODULE_1__/* .arbitrumSepolia */ .Z) {
    bankAddr = "0xE9392735212053Cdcc007F954342B63986386C58"
    ricoAddr = "0x03d710ead07D025d93aF5FEC773Ad0d81D7c8e72"
    riskAddr = "0x2d6E58a7C24D40b4cA5efd882994851154A47e7B"
} else if (chain === viem_chains__WEBPACK_IMPORTED_MODULE_0__/* .arbitrum */ .y) {
    bankAddr = "0x7231C81266274a2Fe43AFF2e38954aF3d3f42114"
    ricoAddr = "0x1253acE51EbADFb0b7bAd1903BDeE4f96A318231"
    riskAddr = "0x883DF9307095669a06C673e0D9026bedDBc7545a"
} else {
    throw new Error(`Unsupported chain: ${chain}.`)
}

const gemAbi = (0,viem__WEBPACK_IMPORTED_MODULE_2__/* .parseAbi */ .V)([
    "function balanceOf(address) external view returns (uint256)"
])
const multicall3Abi = (0,viem__WEBPACK_IMPORTED_MODULE_2__/* .parseAbi */ .V)([
    "function getCurrentBlockTimestamp() external view returns (uint256 timestamp)",
    "function getEthBalance(address addr) external view returns (uint256 balance)"
])
const bankAbi = (0,viem__WEBPACK_IMPORTED_MODULE_2__/* .parseAbi */ .V)([
    "function bel() view returns (uint256)",
    "function chi() view returns (uint256)",
    "function dust() view returns (uint256)",
    "function fee() view returns (uint256)",
    "function frob(int256,int256) payable returns ()",
    "function gif() view returns (uint256)",
    "function lax() view returns (uint256)",
    "function liqr() view returns (uint256)",
    "function mine() returns ()",
    "function mop() view returns (uint256)",
    "function par() view returns (uint256)",
    "function rack() view returns (uint256)",
    "function rho() view returns (uint256)",
    "function rico() view returns (address)",
    "function risk() view returns (address)",
    "function safe(address) view returns (uint256,uint256)",
    "function urns(address) view returns (uint256,uint256)",
    "function wal() view returns (uint256)",
    "function way() view returns (uint256)",
])

const $ = document.querySelector.bind(document);
const BLN = BigInt(10) ** BigInt(9)
const WAD = BigInt(10) ** BigInt(18)
const RAY = BigInt(10) ** BigInt(27)
const BANKYEAR = ((365 * 24) + 6) * 3600
const ERR_ACCT = '0x' + '1'.repeat(40);

let account, transport, publicClient, walletClient
let bank
let store = {}

const borrowing = () => $('input[name="sign"]:checked').value === "Borrow/deposit"

const updateRicoStats = async () => {
    const ricoStats = $('#ricoStats');
    ricoStats.textContent = ' '
    const [parRay, wayRay] = await Promise.all([
        bank.read.par(),
        bank.read.way(),
    ]);
    const par = (0,viem__WEBPACK_IMPORTED_MODULE_3__/* .formatUnits */ .b)(parRay, 27)
    const way = apy(wayRay)

    ricoStats.textContent = `Par: ${round7(par)}, Price rate: ${way}%`
}

const update = async () => {
    reset()
    const frobBtn = $('#btnFrob')
    frobBtn.disabled = true
    await updateStats()
    updateSafetyFactor()
    frobBtn.disabled = account === ERR_ACCT
}

const updateStats = async () => {
    updateDricoLabel($('#dricoLabelContainer'), $('#drico'))
    updateDinkLabel()

    const [urnRes, par, liqr, rack, fee, rho, dust, wal, chi, timestamp, usrRisk, usrRico] = await Promise.all([
        bank.read.urns([account]),
        bank.read.par(),
        bank.read.liqr(),
        bank.read.rack(),
        bank.read.fee(),
        bank.read.rho(),
        bank.read.dust(),
        bank.read.wal(),
        bank.read.chi(),
        publicClient.readContract({
            address: chain.contracts.multicall3.address,
            abi: multicall3Abi,
            functionName: 'getCurrentBlockTimestamp'
        }),
        publicClient.readContract({
            address: riskAddr,
            abi: gemAbi,
            functionName: 'balanceOf',
            args: [account]
        }),
        publicClient.readContract({
            address: ricoAddr,
            abi: gemAbi,
            functionName: 'balanceOf',
            args: [account]
        }),
    ])

    const [ink, art] = urnRes;
    const stretchedRack = grow(rack, fee, timestamp - rho)
    const feepct = apy1DP(fee)
    const dustInk = dust * wal / RAY
    const dustInkStr = (0,viem__WEBPACK_IMPORTED_MODULE_4__/* .formatEther */ .d)(dustInk)
    const debt = (0,viem__WEBPACK_IMPORTED_MODULE_3__/* .formatUnits */ .b)(art * stretchedRack, 45)
    const inkStr = (0,viem__WEBPACK_IMPORTED_MODULE_4__/* .formatEther */ .d)(BigInt(ink))
    const ltv = Number(BLN) / Number(BigInt(liqr) / WAD)
    const ltvStr = `${parseFloat(ltv * 100).toFixed(0)}%`
    const ricoStr = formatBalance(usrRico)
    const riskStr = formatBalance(usrRisk)
    const elapsed = timestamp - chi
    store.ink = BigInt(ink)
    store.art = art
    store.par = par
    store.rack = stretchedRack
    store.dustInk = dustInk
    store.liqr = BigInt(liqr)
    store.usrRisk = usrRisk
    store.debtStr = parseFloat(debt).toFixed(3)
    store.usrRico = usrRico
    $('#ilkStats').textContent = `Quantity rate: ${feepct}%, Min collateral: ${round(dustInkStr)} Risk, LTV: ${ltvStr}`
    $('#urnStats').textContent = `Risk held: ${riskStr}, ${ricoName} held: ${ricoStr} \n\n Deposited Risk: ${parseFloat(inkStr).toFixed(3)}, ${ricoName} debt: ${store.debtStr}`
    $('#elapsed').textContent = `Elapsed: ${elapsed} seconds`
}

const updateDricoLabel = (container, input) => {
    if (borrowing()) {
        container.textContent = `Borrow ${ricoName}:`
    } else {
        container.innerHTML = `Repay ${ricoName}(<input type="checkbox" id="dricoAllCheckbox" title="Wipe all debt">all):`
        $('#dricoAllCheckbox').addEventListener('change', (event) => {
            store.repayAll = input.disabled = event.target.checked
            if (store.repayAll) input.value = store.debtStr
            updateSafetyFactor();
        })
    }
}

const updateDinkLabel = () => {
    let container = $('#dinkLabelContainer')
    let input = $('#dink')
    let verb = borrowing() ? "Deposit" : "Withdraw"

    container.innerHTML = `${verb} Risk(<input type="checkbox" id="dinkAllCheckbox">all):`

    $('#dinkAllCheckbox').addEventListener('change', event => {
        store.allInk = input.disabled = event.target.checked
        let inkValue = borrowing() ? store.usrRisk : store.ink
        let inkLongText = (0,viem__WEBPACK_IMPORTED_MODULE_4__/* .formatEther */ .d)(inkValue)
        if (store.allInk) input.value = parseFloat(inkLongText).toFixed(3)
        updateSafetyFactor()
    })
}

const updateSafetyFactor = () => {
    let factor = ''
    let art = store.art + readDart()
    let loan = art * store.rack * store.par / RAY / RAY
    const sign = borrowing() ? "" : "-"
    let ink = store.ink + (0,viem__WEBPACK_IMPORTED_MODULE_5__/* .parseUnits */ .v)(sign + $('#dink').value, 18)
    let value = ink * RAY / store.liqr
    if (loan === 0n) {
        factor = '∞'
        store.safetyNumber = Number.MAX_VALUE
    } else {
        // get Number ratio from BN WADs which may be > maximum Number
        store.safetyNumber = Number(BLN * value / loan) / Number(BLN)
        factor = round(store.safetyNumber)
    }
    $('#safetyFactor').textContent = `New safety factor: ${factor}`
}
const reset = () => {
    store = {}
    $('#dinkLabelContainer').innerHTML = $('#dricoLabelContainer').innerHTML = ':'
    $('#dink').disabled = $('#drico').disabled = false
    $('#dink').value = $('#drico').value = 0
    $('#btnFrob').value = $('input[name="sign"]:checked').value
    $('#safetyFactor').textContent = `New safety factor: …`
    $('#frobError').style.display = "none"
}

const readDart = () => {
    let dart
    if (store.repayAll && !borrowing())
        dart = -store.art
    else {
        const sign = borrowing() ? "" : "-"
        const drico = (0,viem__WEBPACK_IMPORTED_MODULE_5__/* .parseUnits */ .v)(sign + $('#drico').value, 18)
        dart = drico * RAY / store.rack
    }
    return dart
}

const displayFrobSimRevert = (err) => {
    if (err?.cause instanceof viem__WEBPACK_IMPORTED_MODULE_6__/* .UserRejectedRequestError */ .ab) return

    const errElement = $('#frobError')
    const dart = readDart()
    const resultDebt = (store.art + dart) * store.rack
    const sign = borrowing() ? "" : "-"
    const resultInk = store.ink + (0,viem__WEBPACK_IMPORTED_MODULE_5__/* .parseUnits */ .v)(sign + $('#dink').value, 18)
    let reason = "Transaction simulation reverted."

    if (resultInk > 0n && resultInk < store.dustInk) reason += " Resulting collateral < minimum."
    if (resultDebt < 0n) reason += " Excess wipe, use repay all checkbox."
    if (store.safetyNumber >= 0 && store.safetyNumber < 1.0) reason += " Safety factor must be > 1.0."
    if (store.usrRico < (-dart * store.rack / RAY)) reason += `Insufficient ${ricoName} balance.`
    if (store.dink > store.usrRisk) reason += " Insufficient Risk balance."
    // This could be extended with time-outs, debt ceilings, using error sigs/names etc

    errElement.textContent = reason
    errElement.style.display = "block"
}

const frob = async () => {
    const dart = readDart()
    let dink
    if (store.allInk) {
        dink = borrowing() ? store.usrRisk : -store.ink
    } else {
        const sign = borrowing() ? "" : "-"
        dink = (0,viem__WEBPACK_IMPORTED_MODULE_5__/* .parseUnits */ .v)(sign + $('#dink').value, 18);
    }
    store.dink = dink

    try {
        const {request} = await bank.simulate.frob({account: account, args: [dink, dart]})
        const hash = await walletClient.writeContract(request)
        await publicClient.waitForTransactionReceipt({hash})
        await Promise.all([updateRicoStats(), update()])
    } catch (err) {
        displayFrobSimRevert(err)
    }
}

const mine = async () => {
    const hash = await bank.write.mine()
    await publicClient.waitForTransactionReceipt({hash})
    await Promise.all([updateRicoStats(), update()])
}

// attempt to connect to injected window.ethereum. No connect button, direct wallet connect support, or dependency
const simpleConnect = async () => {
    let _account, _transport
    try {
        if (!window.ethereum) throw new Error();
        [_account] = await window.ethereum.request({method: 'eth_requestAccounts'});
        _transport = (0,viem__WEBPACK_IMPORTED_MODULE_7__/* .custom */ .P)(window.ethereum)
    } catch (error) {
        _account = ERR_ACCT
        _transport = (0,viem__WEBPACK_IMPORTED_MODULE_8__/* .http */ .d)()
        $('#btnFrob').disabled = true
        $('#connectionError').style.display = "block"
    }
    return [_account, _transport]
}

window.onload = async () => {
    [account, transport] = await simpleConnect();
    walletClient = (0,viem__WEBPACK_IMPORTED_MODULE_9__/* .createWalletClient */ .K)({
        account,
        chain: chain,
        transport: transport
    })
    publicClient = (0,viem__WEBPACK_IMPORTED_MODULE_10__/* .createPublicClient */ .v)({
        batch: {
            multicall: true,
        },
        chain: chain,
        transport: transport,
    })
    const _client = {public: publicClient, wallet: walletClient}
    bank = (0,viem__WEBPACK_IMPORTED_MODULE_11__/* .getContract */ .uN)({
        address: bankAddr,
        abi: bankAbi,
        client: _client
    })

    $('#btnFrob').addEventListener('click', async () => {
        $('#frobError').style.display = "none"
        await frob()
    });
    $('#btnMine').addEventListener('click', async () => {
        await mine()
    });

    document.querySelectorAll('input[name="sign"]').forEach((elem) => {
        elem.addEventListener("change", async () => {
            await update();
        });
    });

    document.querySelectorAll('input[name="dink"], input[name="drico"]').forEach((elem) => {
        elem.addEventListener("change", async () => {
            await updateSafetyFactor();
        });
    });

    // if a wallet is connected, attempt to set chain
    if (account !== ERR_ACCT) {
        try {
            await walletClient.switchChain({id: chain.id})
        } catch (err) {
            await walletClient.addChain({chain: chain})
            await walletClient.switchChain({id: chain.id})
        }
    }

    await Promise.all([updateRicoStats(), update()])
}

/* Pure helpers */

const formatBalance = (usrRico) => {
    // round down in case someone copies to repay
    const decimals = 4
    const truncate = BigInt(10) ** BigInt(18 - decimals) / 2n
    const bal = usrRico > truncate ? usrRico - truncate : usrRico
    return parseFloat((0,viem__WEBPACK_IMPORTED_MODULE_4__/* .formatEther */ .d)(bal)).toFixed(decimals)
}

const apy = r => round(((Number(r) / 10 ** 27) ** BANKYEAR - 1) * 100)
const apy1DP = r => parseFloat(((Number(r) / 10 ** 27) ** BANKYEAR - 1) * 100).toFixed(1)

const round = f => parseFloat(f).toPrecision(4)
const round7 = f => parseFloat(f).toPrecision(7)

const grow = (amt, ray, dt) => {
    for (let i = 0; i < dt; i++) {
        amt = amt * ray / RAY
    }
    return amt
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		// The chunk loading function for additional chunks
/******/ 		// Since all referenced chunks are already included
/******/ 		// in this file, this function is empty here.
/******/ 		__webpack_require__.e = () => (Promise.resolve());
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			179: 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = (chunkId) => (installedChunks[chunkId] === 0);
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunkricoview"] = self["webpackChunkricoview"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, [697], () => (__webpack_require__(4047)))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;