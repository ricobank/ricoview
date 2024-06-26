// Copyright (C) 2024 halys

import { createPublicClient, createWalletClient, custom, formatEther, formatUnits, getContract, http, parseAbi, parseUnits,
    UserRejectedRequestError } from 'viem'
import { arbitrum, arbitrumSepolia } from 'viem/chains'

const chain = arbitrumSepolia
const ricoName = 'Kola'

let bankAddr, ricoAddr, riskAddr

if (chain === arbitrumSepolia) {
    bankAddr = "0xE9392735212053Cdcc007F954342B63986386C58"
    ricoAddr = "0x03d710ead07D025d93aF5FEC773Ad0d81D7c8e72"
    riskAddr = "0x2d6E58a7C24D40b4cA5efd882994851154A47e7B"
} else if (chain === arbitrum) {
    bankAddr = "0x0"
    ricoAddr = "0x0"
    riskAddr = "0x883DF9307095669a06C673e0D9026bedDBc7545a"
} else {
    throw new Error(`Unsupported chain: ${chain}.`)
}

const gemAbi = parseAbi([
    "function balanceOf(address) external view returns (uint256)"
])
const multicall3Abi = parseAbi([
    "function getCurrentBlockTimestamp() external view returns (uint256 timestamp)",
    "function getEthBalance(address addr) external view returns (uint256 balance)"
])
const bankAbi = parseAbi([
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

const borrowing =()=> $('input[name="sign"]:checked').value === "Borrow/deposit"

const updateRicoStats = async () => {
    const ricoStats = $('#ricoStats');
    ricoStats.textContent = ' '
    const [parRay, wayRay] = await Promise.all([
        bank.read.par(),
        bank.read.way(),
    ]);
    const par = formatUnits(parRay, 27)
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
    const feepct = apy(fee)
    const dustInk = dust * wal / RAY
    const dustInkStr = formatEther(dustInk)
    const debt = formatUnits(art * stretchedRack, 45)
    const inkStr = formatEther(BigInt(ink))
    const ltv  = Number(BLN) / Number(BigInt(liqr) / WAD)
    const ricoStr = formatBalance(usrRico)
    const riskStr = formatBalance(usrRisk)
    const elapsed = timestamp - chi
    store.ink  = BigInt(ink)
    store.art  = art
    store.par  = par
    store.rack = stretchedRack
    store.dustInk = dustInk
    store.liqr = BigInt(liqr)
    store.usrRisk = usrRisk
    store.debtStr = parseFloat(debt).toFixed(3)
    store.usrRico = usrRico
    $('#ilkStats').textContent = `Quantity rate: ${feepct}%, Min collateral: ${round(dustInkStr)} Risk, LTV: ${round(ltv * 100)}%`
    $('#urnStats').textContent = `Risk held: ${riskStr}, ${ricoName} held: ${ricoStr} \n\n Deposited Risk: ${parseFloat(inkStr).toFixed(3)}, ${ricoName} debt: ${store.debtStr}`
    $('#stock').textContent = `Elapsed: ${elapsed} seconds`
}

const updateDricoLabel = (container, input) => {
    if (borrowing()) {
        container.textContent = `Borrow ${ricoName}:`
    } else {
        container.innerHTML = `Repay ${ricoName}(<input type="checkbox" id="dricoAllCheckbox" title="Wipe all debt">all):`
        $('#dricoAllCheckbox').addEventListener('change', (event) => {
            store.repayAll = input.disabled = event.target.checked
            if(store.repayAll) input.value = store.debtStr
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
        let inkLongText = formatEther(inkValue)
        if(store.allInk) input.value = parseFloat(inkLongText).toFixed(3)
        updateSafetyFactor()
    })
}

const updateSafetyFactor =()=> {
    let factor = ''
    let art = store.art + readDart()
    let loan = art * store.rack * store.par / RAY / RAY
    const sign = borrowing() ? "" : "-"
    let ink = store.ink + parseUnits(sign + $('#dink').value, 18)
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
const reset = ()=> {
    store = {}
    $('#dinkLabelContainer').innerHTML = $('#dricoLabelContainer').innerHTML = ':'
    $('#dink').disabled = $('#drico').disabled = false
    $('#dink').value = $('#drico').value = 0
    $('#btnFrob').value = $('input[name="sign"]:checked').value
    $('#safetyFactor').textContent = `New safety factor: …`
    $('#frobError').style.display = "none"
}

const readDart =()=> {
    let dart
    if (store.repayAll && !borrowing())
        dart = -store.art
    else {
        const sign = borrowing() ? "" : "-"
        const drico = parseUnits(sign + $('#drico').value, 18)
        dart = drico * RAY / store.rack
    }
    return dart
}

const displayFrobSimRevert =(err)=> {
    if (err?.cause instanceof UserRejectedRequestError) return

    const errElement = $('#frobError')
    const dart = readDart()
    const resultDebt = (store.art + dart) * store.rack
    const sign = borrowing() ? "" : "-"
    const resultInk = store.ink + parseUnits(sign + $('#dink').value, 18)
    let reason = "Transaction simulation reverted."

    if (resultInk > 0n && resultInk < store.dustInk) reason += " Resulting collateral < minimum."
    if (resultDebt < 0n) reason += " Excess wipe, use repay all checkbox."
    if (store.safetyNumber >= 0 && store.safetyNumber < 1.0) reason += " Safety factor must be > 1.0."
    if (store.usrRico < (-dart * store.rack / RAY)) reason +=  `Insufficient ${ricoName} balance.`
    if (store.dink > store.usrRisk) reason += " Insufficient Risk balance."
    // This could be extended with time-outs, debt ceilings, using error sigs/names etc

    errElement.textContent = reason
    errElement.style.display = "block"
}

const frob = async () => {
    const dart = readDart()
    let dink
    if(store.allInk) {
        dink = borrowing() ? store.usrRisk : -store.ink
    } else {
        const sign = borrowing() ? "" : "-"
        dink = parseUnits(sign + $('#dink').value, 18);
    }
    store.dink = dink

    try {
        const { request } = await bank.simulate.frob({account: account, args: [dink, dart]})
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
        [_account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
        _transport = custom(window.ethereum)
    } catch (error) {
        _account = ERR_ACCT
        _transport = http()
        $('#btnFrob').disabled = true
        $('#connectionError').style.display = "block"
    }
    return [_account, _transport]
}

window.onload = async() => {
    [account, transport] = await simpleConnect();
    walletClient = createWalletClient({
      account,
      chain: chain,
      transport: transport
    })
    publicClient = createPublicClient({
      batch: {
        multicall: true,
      },
      chain: chain,
      transport: transport,
    })
    const _client = {public: publicClient, wallet: walletClient}
    bank = getContract({
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
            await walletClient.switchChain({ id: chain.id })
        } catch (err) {
            await walletClient.addChain({ chain: chain })
            await walletClient.switchChain({ id: chain.id })
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
    return parseFloat(formatEther(bal)).toFixed(decimals)
}

const apy =r=> round(((Number(r) / 10**27) ** BANKYEAR - 1) * 100)

const round =f=> parseFloat(f).toPrecision(4)
const round7 =f=> parseFloat(f).toPrecision(7)

const grow = (amt, ray, dt) => {
    for (let i = 0; i < dt; i++) {
        amt = amt * ray / RAY
    }
    return amt
}
