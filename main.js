// Copyright (C) 2024 halys

import { createPublicClient, createWalletClient, custom, decodeAbiParameters, encodeAbiParameters, formatUnits,
    getContract, hexToBigInt, http, pad, parseAbi, parseUnits, stringToHex, toHex, UserRejectedRequestError } from 'viem'
import { arbitrum } from 'viem/chains'
import BankDiamond from './BankDiamond.json';

const bankAddr   = "0x598C6c1cd9459F882530FC9D7dA438CB74C6CB3b"
const feedAddr   = "0xa84F3ad46f6Fa8D09B52EbC61f1C25aeF33231F8"
const nfpmAddr   = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"
const wrapAddr   = "0xf18eA2cf7A87C3F11fF8FF6B073DdEDfE2497f03"
const ricoAddr   = "0x5374EcC160A4bd68446B43B5A6B132F9c001C54C"
const arbAddr    = "0x912CE59144191C1204E64559FE8253a0e49E6548"
const daiAddr    = "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1"
const linkAddr   = "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4"
const rethAddr   = "0xEC70Dcb4A1EFa46b8F2D97C310C9c4790ba5ffA8"
const usdcAddr   = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
const usdc_eAddr = "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"
const wbtcAddr   = "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f"
const wethAddr   = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
const wstethAddr = "0x5979D7b546E38E414F7E9822514be443A4800529"

const uniIlk = stringToHex(":uninft", {size: 32})

const feedAbi  = parseAbi([
    "function pull(address src, bytes32 tag) external view returns (bytes32 val, uint256 ttl)"
])
const gemAbi = parseAbi([
    "function allowance(address, address) external view returns (uint256)",
    "function approve(address usr, uint256 wad) external payable returns (bool ok)",
    "function balanceOf(address) external view returns (uint256)"
])
const nfpmAbi = parseAbi([
    "function approve(address to, uint256 tokenId)",
    "function getApproved(uint256 tokenId) returns (address operator)",
    "function setApprovalForAll(address operator, bool approved)",
    "function isApprovedForAll(address owner, address operator) returns (bool approved)",
    "function balanceOf(address owner) view returns (uint)",
    "function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)"
])
const wrapAbi = parseAbi([
    "function total(address nfpm, uint tokenId, uint160 sqrtPriceX96) external view returns (uint amount0, uint amount1)"
])
const multicall3Abi = parseAbi([
    "function getCurrentBlockTimestamp() external view returns (uint256 timestamp)",
    "function getEthBalance(address addr) external view returns (uint256 balance)"
])
const wethAbi = parseAbi([
    "function deposit() external payable",
    "function withdraw(uint256 wad) external"
])
const bankAbi = BankDiamond.abi

const $ = document.querySelector.bind(document);
const BLN = BigInt(10) ** BigInt(9)
const WAD = BigInt(10) ** BigInt(18)
const RAY = BigInt(10) ** BigInt(27)
const BANKYEAR = ((365 * 24) + 6) * 3600
const MAXUINT  = BigInt(2)**BigInt(256) - BigInt(1);
const FREE = MAXUINT  // -1
const LOCK = BigInt(1)
const X96 = BigInt(2) ** BigInt(96)
const ERR_ACCT = '0x' + '1'.repeat(40);
const MIN_ETH = BigInt(10) ** BigInt(16)
const chain = arbitrum
// Uni Position() return value indices
const t0 = 2
const t1 = 3
const id = 12
const x32 = (s) => stringToHex(s, {size: 32})
const tokenData = {
    arb:    {decimals: 18, address: arbAddr,    display: "ARB",    ilk: x32("arb")},
    dai:    {decimals: 18, address: daiAddr,    display: "DAI",    ilk: x32("dai")},
    link:   {decimals: 18, address: linkAddr,   display: "LINK",   ilk: x32("link")},
    reth:   {decimals: 18, address: rethAddr,   display: "rETH",   ilk: x32("reth")},
    usdc:   {decimals: 6,  address: usdcAddr,   display: "USDC",   ilk: x32("usdc")},
    usdc_e: {decimals: 6,  address: usdc_eAddr, display: "USDC.e", ilk: x32("usdc.e")},
    wbtc:   {decimals: 8,  address: wbtcAddr,   display: "WBTC",   ilk: x32("wbtc")},
    weth:   {decimals: 18, address: wethAddr,   display: "WETH",   ilk: x32("weth")},
    wsteth: {decimals: 18, address: wstethAddr, display: "wstETH", ilk: x32("wsteth")},
}

let account, transport, publicClient, walletClient
let bank, feed, nfpm, wrap, weth
let store = {}

const borrowing =()=> $('input[name="sign"]:checked').value === "Borrow/deposit"
const uniMode =()=> $('input[name="ctype"]:checked').value == "UNIV3 LP NFTs"

const updateRicoStats = async () => {
    const ricoStats = $('#ricoStats');
    ricoStats.textContent = ' '
    const tip = await bank.read.tip()
    const [parRay, wayRay, feedData] = await Promise.all([
        bank.read.par(),
        bank.read.way(),
        feed.read.pull([tip.src, tip.tag])
    ]);
    const par = formatUnits(parRay, 27)
    const way = apy(wayRay)
    const mar = formatUnits(BigInt(feedData[0]), 27)
    ricoStats.textContent = `Par: ${round7(par)}, Price rate: ${way}%, Market: ${round7(mar)}`
}

const updateHook = async () => {
    reset()
    const frobBtn = $('#btnFrob')
    const showUni = uniMode()

    frobBtn.disabled = true
    document.getElementById("uniHook").style.display   = showUni ? "block" : "none";
    document.getElementById("uniFrobControls").style.display   = showUni ? "flex" : "none";

    document.getElementById("erc20Hook").style.display = showUni ? "none"  : "block";
    document.getElementById("erc20FrobControls").style.display = showUni ? "none"  : "flex";
    await (showUni ? updateUni() : updateERC20());
    updateSafetyFactor()
    frobBtn.disabled = account === ERR_ACCT
}

const updateUni = async () => {
    const NFTsContainer  = $('#nftContainer')
    NFTsContainer.innerHTML = '';
    updateDricoLabel($('#uniDricoLabelContainer'), $('#uniDrico'))

    const [numNFTs, ilk, ink, urn, par, timestamp, usrRico] = await Promise.all([
        nfpm.read.balanceOf([account]),
        bank.read.ilks([uniIlk]),
        bank.read.ink( [uniIlk, account]),
        bank.read.urns([uniIlk, account]),
        bank.read.par(),
        publicClient.readContract({
            address: chain.contracts.multicall3.address,
            abi: multicall3Abi,
            functionName: 'getCurrentBlockTimestamp'
        }),
        publicClient.readContract({
            address: ricoAddr,
            abi: gemAbi,
            functionName: 'balanceOf',
            args: [account]
        }),
    ])
    const stretchedRack = grow(ilk.rack, ilk.fee, timestamp - ilk.rho)
    const fee  = apy(ilk.fee)
    const dust = formatUnits(ilk.dust, 45)
    const debt = formatUnits(urn * stretchedRack, 45)
    const ricoStr = formatBalance(usrRico)
    store.ink  = decodeAbiParameters([{ name: 'ink', type: 'uint[]' }], ink)[0]
    store.art  = urn
    store.rack = stretchedRack
    store.par  = par
    store.dust  = ilk.dust
    store.debtStr = parseFloat(debt).toFixed(3)
    store.usrRico = usrRico
    const inkStr = store.ink.length === 0 ? 'none' : store.ink
    $('#uniIlkStats0').textContent = `Quantity rate: ${fee}%, Min debt: ${round(dust)} Rico`
    $('#uniUrnStats').textContent = `Deposited NFTS: ${inkStr}, Rico debt: ${store.debtStr}, Rico: ${ricoStr}`

    let usrIDs = [];
    if (borrowing()) {
        $('#NFTList').textContent= `LP NFTs to deposit:`
        const idsProm = Array.from({ length: Number(numNFTs) }, (_, i) => nfpm.read.tokenOfOwnerByIndex([account, i]));
        usrIDs = await Promise.all(idsProm);
        await valueNFTs([...usrIDs, ...store.ink])
        displayNfts(usrIDs)
    } else {
        $('#NFTList').textContent = `LP NFT IDS to withdraw:`;
        await valueNFTs(store.ink)
        displayNfts(store.ink)
    }
}

// store the liqr adjusted rico value of all NFTs
const valueNFTs = async (nfts) => {
    const posiProms = nfts.map(async nft => {
        const positions = await nfpm.read.positions([nft]);
        return [...positions, nft];
    });
    let positions = await Promise.all(posiProms);
    const tokens  = new Set(positions.flatMap(pos => [pos[t0], pos[t1]]))

    // get src, tag and liqr for all tokens in one multicall trip
    const argProms = {}
    Array.from(tokens).forEach(tok => {
        argProms[tok] = [
            bank.read.geth([uniIlk, x32('src'),  [rpaddr(tok)]]),
            bank.read.geth([uniIlk, x32('tag'),  [rpaddr(tok)]]),
            bank.read.geth([uniIlk, x32('liqr'), [rpaddr(tok)]]),
        ];
    })
    const tokToArgs = {};
    for (const tok of Object.keys(argProms)) {
        const [src, tag, liqr] = await Promise.all(argProms[tok]);
        tokToArgs[tok] = { src: src.slice(0, 42), tag, liqr };
    }

    const feedProms = Array.from(tokens).map(async tok => {
        const { src, tag } = tokToArgs[tok]
        let val = x32('')
        if (src !== x20('')) [val] = await feed.read.pull([src, tag])
        return [tok, hexToBigInt(val, { size: 32 })]
    })
    const prices = await Promise.all(feedProms)
    const gemToPrice = Object.fromEntries(prices)

    // filter positions containing token without feed
    positions = positions.filter(pos =>
        tokToArgs[pos[t0]].src !== x20('') && tokToArgs[pos[t1]].src !== x20('')
    );

    const valProms = positions.map(async pos => {
        const sqrtPriceX96 = sqrt(gemToPrice[pos[t1]] * X96 * X96 / gemToPrice[pos[t0]])
        const [amt0, amt1] = await wrap.read.total([nfpmAddr, pos[id], sqrtPriceX96])
        const liqr = maxBigInt(BigInt(tokToArgs[pos[t0]].liqr), BigInt(tokToArgs[pos[t1]].liqr))
        return [pos[id], (amt0 * gemToPrice[pos[t0]] + amt1 * gemToPrice[pos[t1]]) / liqr]
    })
    const valsArr = await Promise.all(valProms)
    store.idToVal = Object.fromEntries(valsArr)
}

// todo this displays checkboxes for each uni nft with token IDs for labels
// ~"symbol/symbol [min price, max price]" could be better. Or people can find id in uni app
function displayNfts(nftIds) {
    const container = document.getElementById('nftContainer');

    // only display positions where both tokens have feeds
    nftIds = nftIds.filter(id => store.idToVal[id] !== undefined)
    nftIds = nftIds.filter(id => store.idToVal[id] > 0n)
    if (nftIds.length == 0) {
        container.textContent = 'none'
        return
    }

    nftIds.forEach(id => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `nft-${id}`;
        checkbox.value = id;

        const label = document.createElement('label');
        label.htmlFor = `nft-${id}`;
        label.textContent = `${id}`;

        const div = document.createElement('div');
        div.style.marginRight = '10px'
        div.appendChild(checkbox);
        div.appendChild(label);

        container.appendChild(div);
    });

    document.querySelectorAll('#nftContainer input[type="checkbox"]').forEach((elem) => {
        elem.addEventListener("change", async () => {
            await updateSafetyFactor();
        });
    });
}

function getSelectedNfts() {
    const checkboxes = document.querySelectorAll('#nftContainer input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(checkbox => BigInt(checkbox.value));
}

const updateERC20 = async () => {
    const ilkStr = $('input[name="ilk"]:checked').value
    const ilkHex = tokenData[ilkStr].ilk
    const gemName = tokenData[ilkStr].display
    updateDricoLabel($('#dricoLabelContainer'), $('#drico'))
    updateDinkLabel(ilkStr, gemName)

    const [srcB32, tag] = await Promise.all([
        bank.read.geth([ilkHex, x32('src'), []]),
        bank.read.geth([ilkHex, x32('tag'), []]),
    ])
    const src = srcB32.slice(0, 42)

    const [ilk, urn, ink, par, liqr, usrGemAllowance, usrGemBal, feedData, timestamp, ethBal, usrRico] = await Promise.all([
        bank.read.ilks([ilkHex]),
        bank.read.urns([ilkHex, account]),
        bank.read.ink( [ilkHex, account]),
        bank.read.par(),
        bank.read.geth([ilkHex, stringToHex('liqr', {size: 32}), []]),
        publicClient.readContract({
            address: tokenData[ilkStr].address,
            abi: gemAbi,
            functionName: 'allowance',
            args: [account, bankAddr]
        }),
        publicClient.readContract({
            address: tokenData[ilkStr].address,
            abi: gemAbi,
            functionName: 'balanceOf',
            args: [account]
        }),
        feed.read.pull([src, tag]),
        publicClient.readContract({
            address: chain.contracts.multicall3.address,
            abi: multicall3Abi,
            functionName: 'getCurrentBlockTimestamp'
        }),
        publicClient.readContract({
            address: chain.contracts.multicall3.address,
            abi: multicall3Abi,
            functionName: 'getEthBalance',
            args: [account]
        }),
        publicClient.readContract({
            address: ricoAddr,
            abi: gemAbi,
            functionName: 'balanceOf',
            args: [account]
        }),
    ])

    const stretchedRack = grow(ilk.rack, ilk.fee, timestamp - ilk.rho)
    const fee  = apy(ilk.fee)
    const dust = formatUnits(ilk.dust, 45)
    const debt = formatUnits(urn * stretchedRack, 45)
    const inkStr = formatUnits(BigInt(ink), tokenData[ilkStr].decimals)
    const ltv  = Number(BLN) / Number(BigInt(liqr) / WAD)
    const ricoStr = formatBalance(usrRico)
    const unwrapped = (ilkStr === 'weth') ? maxBigInt(ethBal - MIN_ETH, 0n) : 0n
    store.ink  = BigInt(ink)
    store.art  = urn
    store.par  = par
    store.rack = stretchedRack
    store.dust = ilk.dust
    store.liqr = BigInt(liqr)
    store.feed = BigInt(feedData[0])
    store.usrGemAllowance = usrGemAllowance
    store.usrGemBal = usrGemBal
    store.unwrapped = unwrapped
    store.debtStr = parseFloat(debt).toFixed(3)
    store.usrRico = usrRico
    $('#ilkStats0').textContent = `Quantity rate: ${fee}%, Min debt: ${round(dust)} Rico, LTV: ${round(ltv * 100)}%`
    $('#urnStats').textContent = `Deposited ${gemName}: ${parseFloat(inkStr).toFixed(3)}, Rico debt: ${store.debtStr}, Rico: ${ricoStr}`
}

const updateDricoLabel = (container, input) => {
    if (borrowing()) {
        container.textContent = 'Borrow Rico:'
    } else {
        container.innerHTML = `Repay Rico(<input type="checkbox" id="dricoAllCheckbox" title="Wipe all debt">all):`
        $('#dricoAllCheckbox').addEventListener('change', (event) => {
            store.repayAll = input.disabled = event.target.checked
            if(store.repayAll) input.value = store.debtStr
            updateSafetyFactor();
        })
    }
}

const updateDinkLabel = (ilkStr, gemName) => {
    let container = $('#dinkLabelContainer')
    let input = $('#dink')
    let verb = borrowing() ? "Deposit" : "Withdraw"

    container.innerHTML = `${verb} ${gemName}(<input type="checkbox" id="dinkAllCheckbox">all):`

    $('#dinkAllCheckbox').addEventListener('change', event => {
        store.allInk = input.disabled = event.target.checked
        let inkValue = borrowing() ? store.usrGemBal + store.unwrapped : store.ink
        let inkLongText = formatUnits(inkValue, tokenData[ilkStr].decimals)
        if(store.allInk) input.value = parseFloat(inkLongText).toFixed(3)
        updateSafetyFactor()
    })
}

const updateSafetyFactor =()=> {
    let factor = ''
    let loan, value
    if (uniMode()) {
        let art = store.art + readDart()
        loan = art * store.rack / RAY * store.par / RAY

        const inkVal  = store.ink.reduce((acc, id) => acc + (store.idToVal[id]), BigInt(0));
        const dinkVal = getSelectedNfts().reduce((acc, id) => acc + (store.idToVal[id]), BigInt(0));
        value = inkVal + (borrowing() ? dinkVal : -dinkVal)
    } else {
        let art = store.art + readDart()
        loan = art * store.rack * store.par / RAY  / RAY

        const ilk = $('input[name="ilk"]:checked').value
        const sign = borrowing() ? "" : "-"
        let ink = store.ink + parseUnits(sign + $('#dink').value, tokenData[ilk].decimals)
        value = ink * store.feed / store.liqr
    }

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

const reset =()=> {
    store = {}
    $('#dinkLabelContainer').innerHTML = $('#dricoLabelContainer').innerHTML = $('#uniDricoLabelContainer').innerHTML = ':'
    $('#dink').disabled = $('#drico').disabled = $('#uniDrico').disabled = false
    $('#dink').value = $('#drico').value = $('#uniDrico').value = 0
    $('#btnFrob').value = $('input[name="sign"]:checked').value
    $('#safetyFactor').textContent = `New safety factor: …`
    $('#frobError').style.display = "none"
}

const readDart =()=> {
    const input = uniMode() ? $('#uniDrico') : $('#drico')
    let dart
    if (store.repayAll && !borrowing())
        dart = -store.art
    else {
        const sign = borrowing() ? "" : "-"
        const drico = parseUnits(sign + input.value, 18)
        dart = drico * RAY / store.rack
    }
    return dart
}

const displayFrobSimRevert =(err)=> {
    if (err?.cause instanceof UserRejectedRequestError) return

    const errElement = $('#frobError')
    const dart = readDart()
    const resultDebt = (store.art + dart) * store.rack
    let reason = "Transaction simulation reverted."

    if (resultDebt > 0n && resultDebt < store.dust) reason += " Resulting debt < minimum."
    if (resultDebt < 0n) reason += " Excess wipe, use repay all checkbox"
    if (store.safetyNumber >= 0 && store.safetyNumber < 1.0) reason += " Safety factor must be > 1.0."
    if (store.usrRico < (-dart * store.rack / RAY)) reason += " Insufficient Rico balance."
    if (!uniMode() && store.dink > store.usrGemBal) reason += " Insufficient collateral balance."
    if (!uniMode() && store.dink > store.usrGemAllowance) reason += " Insufficient collateral allowance."
    // This could be extended with time outs, debt ceilings, using error sigs/names etc

    errElement.textContent = reason
    errElement.style.display = "block"
}

const frobUni = async () => {
    let dink = "0x"
    const dart = readDart()
    const nfts = getSelectedNfts()
    if (nfts.length > 0) {
        const dir = borrowing() ? LOCK : FREE
        if (dir === LOCK && !await nfpm.read.isApprovedForAll([account, bankAddr])) {
            const hash = await nfpm.write.setApprovalForAll([bankAddr, true])
            await publicClient.waitForTransactionReceipt({hash})
        }
        dink = encodeAbiParameters([{ name: 'dink', type: 'uint[]' }], [[dir].concat(nfts)]);
    }

    try {
        const { request } = await bank.simulate.frob({account: account, args: [uniIlk, account, dink, dart]})
        const hash = await walletClient.writeContract(request)
        await publicClient.waitForTransactionReceipt({hash})
        await Promise.all([updateRicoStats(), updateHook()])
    } catch (err) {
        displayFrobSimRevert(err)
    }
}

const frobERC20 = async () => {
    const ilkStr = $('input[name="ilk"]:checked').value
    const dart = readDart()
    let dink
    if(store.allInk) {
        dink = borrowing() ? store.usrGemBal + store.unwrapped : -store.ink
    } else {
        const sign = borrowing() ? "" : "-"
        dink = parseUnits(sign + $('#dink').value, tokenData[ilkStr].decimals);
    }
    store.dink = dink
    if (dink > store.usrGemAllowance) {
        const hash = await walletClient.writeContract({
            abi: gemAbi,
            address: tokenData[ilkStr].address,
            functionName: 'approve',
            args: [bankAddr, MAXUINT],
        })
        await publicClient.waitForTransactionReceipt({hash})
        store.usrGemAllowance = MAXUINT
    }
    if (dink > store.usrGemBal && dink <= (store.usrGemBal + store.unwrapped)) {
        const hash = await weth.write.deposit([], {value: dink - store.usrGemBal})
        await publicClient.waitForTransactionReceipt({hash})
    }
    const unwrap = -dink
    if (dink < 0) dink += (BigInt(2)**BigInt(256))
    const dinkB32 = pad(toHex(dink))

    try {
        const { request } = await bank.simulate.frob({account: account, args: [tokenData[ilkStr].ilk, account, dinkB32, dart]})
        const hash = await walletClient.writeContract(request)
        await publicClient.waitForTransactionReceipt({hash})
        await Promise.all([updateRicoStats(), updateHook()])
    } catch (err) {
        displayFrobSimRevert(err)
    }

    if (unwrap > 0 && ilkStr === 'weth') await weth.write.withdraw([unwrap])
}

// attempt to connect to injected window.ethereum. No connect button, direct wallet connect support, or dependency
const simpleConnect = async () => {
    let _account, _transport
    try {
        if (!window.ethereum) throw new Error("Ethereum wallet is not detected.");
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
      transport: http(),  // todo should replace with a dedicated RPC URL to prevent rate-limiting
    })
    const _client = {public: publicClient, wallet: walletClient}
    bank = getContract({
      address: bankAddr,
      abi: bankAbi,
      client: _client
    })
    feed = getContract({
      address: feedAddr,
      abi: feedAbi,
      client: _client
    })
    nfpm = getContract({
      address: nfpmAddr,
      abi: nfpmAbi,
      client: _client
    })
    weth = getContract({
      address: wethAddr,
      abi: wethAbi,
      client: _client
    })
    wrap = getContract({
      address: wrapAddr,
      abi: wrapAbi,
      client: _client
    })

    $('#btnFrob').addEventListener('click', async () => {
        $('#frobError').style.display = "none"
        if (uniMode()) {
            await frobUni()
        } else {
            await frobERC20()
        }
    });

    document.querySelectorAll('input[name="ctype"], input[name="sign"], input[name="ilk"]').forEach((elem) => {
        elem.addEventListener("change", async () => {
            await updateHook();
        });
    });

    document.querySelectorAll('input[name="dink"], input[name="drico"], input[name="uniDrico"]').forEach((elem) => {
        elem.addEventListener("change", async () => {
            await updateSafetyFactor();
        });
    });

    if(account !== ERR_ACCT) await walletClient.switchChain({ id: chain.id })
    await Promise.all([updateRicoStats(), updateHook()])
}

/* Pure helpers */

const formatBalance = (usrRico) => {
    // round down in case someone copies to repay
    const decimals = 4
    const truncate = BigInt(10) ** BigInt(18 - decimals) / 2n
    const bal = usrRico > truncate ? usrRico - truncate : usrRico
    return parseFloat(formatUnits(bal, 18)).toFixed(decimals)
}

const maxBigInt = (a, b) => a > b ? a : b

const apy =r=> round(((Number(r) / 10**27) ** BANKYEAR - 1) * 100)

const round =f=> parseFloat(f).toPrecision(4)
const round7 =f=> parseFloat(f).toPrecision(7)

const x20 = (s) => stringToHex(s, {size: 20})

const rpaddr = (a) => a + '00'.repeat(12)

const grow = (amt, ray, dt) => {
    for (let i = 0; i < dt; i++) {
        amt = amt * ray / RAY
    }
    return amt
}

// https://stackoverflow.com/questions/53683995/javascript-big-integer-square-root
function sqrt(value) {
    if (value < 0n) {
        throw 'square root of negative numbers is not supported'
    }

    if (value < 2n) {
        return value;
    }

    function newtonIteration(n, x0) {
        const x1 = ((n / x0) + x0) >> 1n;
        if (x0 === x1 || x0 === (x1 - 1n)) {
            return x0;
        }
        return newtonIteration(n, x1);
    }

    return newtonIteration(value, 1n);
}
