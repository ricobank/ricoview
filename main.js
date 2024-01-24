import { createPublicClient, createWalletClient, custom, decodeAbiParameters, encodeAbiParameters, formatUnits,
    getContract, hexToBigInt, http, pad, parseAbi, parseUnits, stringToHex, toHex } from 'viem'
import { sepolia } from 'viem/chains'

// sepolia addresses
const bankAddress  = "0x343d30cCCe6c02987329C4fE2664E20F0aD39aa2"
const feedAddress  = "0x16Bb244cd38C2B5EeF3E5a1d5F7B6CC56d52AeF3"
const nfpmAddress  = "0x1238536071E1c677A632429e3655c799b22cDA52"
const wrapAddress  = "0x7fA88e1014B0640833a03ACfEC71F242b5fBDC85"
const rico_addr    = "0x6c9BFDfBbAd23418b5c19e4c7aF2f926ffAbaDfa"
const dai_addr     = "0x290eCE67DDA5eEc618b3Bb5DF04BE96f38894e29"

const arb_addr     = "0x3c6765dd58D75786CD2B20968Aa13beF2a1D85B8"
const stable_addr  = "0x698DEE4d8b5B9cbD435705ca523095230340D875"
const wdiveth_addr = "0x69619b71b52826B93205299e33259E1547ff3331"

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

const BLN = BigInt(10) ** BigInt(9)
const WAD = BigInt(10) ** BigInt(18)
const RAY = BigInt(10) ** BigInt(27)

const tokenData = {
    "mar":          { decimals: 0 },
    "arb":          { decimals: 18 },
    [arb_addr]:     { decimals: 18 },
    "stable":       { decimals: 18 },
    [stable_addr]:  { decimals: 18 },
    "wdiveth":      { decimals: 18 },
    [wdiveth_addr]: { decimals: 18 },
};
const gems = {
    arb:     arb_addr,
    wdiveth: wdiveth_addr,
    stable:  stable_addr
}
const strToDisplay = {
    arb:     "ARB",
    wdiveth: "wdivETH",
    stable:  "STABLE"
}

import BankDiamond from './BankDiamond.json';
const bankAbi = BankDiamond.abi

const x32 = (s) => stringToHex(s, {size: 32})
const rpaddr = (a) => a + '00'.repeat(12)

let account, transport, publicClient, walletClient
let bank, feed, nfpm, wrap

const $ = document.querySelector.bind(document);
const BANKYEAR = ((365 * 24) + 6) * 3600
const MAXUINT  = BigInt(2)**BigInt(256) - BigInt(1);
const FREE = MAXUINT  // -1
const LOCK = BigInt(1)
const X96 = BigInt(2) ** BigInt(96)

// Uni Position() return value indices
const t0 = 2
const t1 = 3
const id = 12

let store = {}

const apy =r=> round(((Number(r) / 10**27) ** BANKYEAR - 1) * 100)
const round =f=> parseFloat(f).toPrecision(4)

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
    ricoStats.textContent = `Rico system price: ${round(par)}, Price rate: ${way}%, Market price: ${round(mar)}`
}

const updateHook = async () => {
    reset()
    $('#btnFrob').disabled = true
    const showUni = uniMode()

    document.getElementById("uniHook").style.display   = showUni ? "block" : "none";
    document.getElementById("erc20Hook").style.display = showUni ? "none"  : "block";
    await (showUni ? updateUni() : updateERC20());
    updateSafetyFactor()

    $('#btnFrob').disabled = false
}

const updateUni = async () => {
    const NFTsContainer  = $('#nftContainer')
    NFTsContainer.innerHTML = '';
    updateDricoLabel($('#uniDricoLabelContainer'), $('#uniDrico'))

    const [numNFTs, ilk, ink, urn, par] = await Promise.all([
        nfpm.read.balanceOf([account]),
        bank.read.ilks([uniIlk]),
        bank.read.ink( [uniIlk, account]),
        bank.read.urns([uniIlk, account]),
        bank.read.par()
    ])
    const fee  = apy(ilk.fee)
    const dust = formatUnits(ilk.dust, 45)
    const debt = formatUnits(urn * ilk.rack, 45)
    store.ink  = decodeAbiParameters([{ name: 'ink', type: 'uint[]' }], ink)[0]
    store.art  = urn
    store.rack = ilk.rack
    store.par  = par
    store.debtStr = parseFloat(debt).toFixed(3)
    $('#uniIlkStats').textContent = `Quantity rate: ${fee}%, Min debt: ${round(dust)} Rico`
    $('#uniUrnStats').textContent = `Deposited NFTS: ${store.ink}, Rico debt: ${store.debtStr}`

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
    const positions = await Promise.all(posiProms);
    const tokens    = new Set(positions.flatMap(pos => [pos[t0], pos[t1]]))

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
        const [val] = await feed.read.pull([src, tag])
        return [tok, hexToBigInt(val, { size: 32 })]
    })
    const prices = await Promise.all(feedProms)
    const gemToPrice = Object.fromEntries(prices)

    const valProms = positions.map(async pos => {
        const sqrtPriceX96 = sqrt(gemToPrice[pos[t1]] * X96 * X96 / gemToPrice[pos[t0]])
        const [amt0, amt1] = await wrap.read.total([nfpmAddress, pos[id], sqrtPriceX96])
        const liqr = maxBigInt(BigInt(tokToArgs[pos[t0]].liqr), BigInt(tokToArgs[pos[t1]].liqr))
        return [pos[id], (amt0 * gemToPrice[pos[t0]] + amt1 * gemToPrice[pos[t1]]) / liqr]
    })
    const valsArr = await Promise.all(valProms)
    store.idToVal = Object.fromEntries(valsArr)
}

// todo this displays checkboxes for each uni nft with token IDs for labels
// ~"symbol/symbol [min price, max price]" could be better. Or people can find id in uni app
// should also filter positions with at least one unsupported tok
function displayNfts(nftIds) {
    const container = document.getElementById('nftContainer');

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
    const ilkHex = stringToHex(ilkStr, {size: 32})
    const gemName = strToDisplay[ilkStr]
    updateDricoLabel($('#dricoLabelContainer'), $('#drico'))
    updateDinkLabel(ilkStr, gemName)

    const [srcB32, tag] = await Promise.all([
        bank.read.geth([ilkHex, x32('src'), []]),
        bank.read.geth([ilkHex, x32('tag'), []]),
    ])
    const src = srcB32.slice(0, 42)

    const [ilk, urn, ink, par, liqr, usrGemAllowance, usrGemBal, feedData] = await Promise.all([
        bank.read.ilks([ilkHex]),
        bank.read.urns([ilkHex, account]),
        bank.read.ink( [ilkHex, account]),
        bank.read.par(),
        bank.read.geth([ilkHex, stringToHex('liqr', {size: 32}), []]),
        publicClient.readContract({
            address: gems[ilkStr],
            abi: gemAbi,
            functionName: 'allowance',
            args: [account, bankAddress]
        }),
        publicClient.readContract({
            address: gems[ilkStr],
            abi: gemAbi,
            functionName: 'balanceOf',
            args: [account]
        }),
        feed.read.pull([src, tag]),
    ])

    const fee  = apy(ilk.fee)
    const dust = formatUnits(ilk.dust, 45)
    const debt = formatUnits(urn * ilk.rack, 45)
    const inkStr = formatUnits(BigInt(ink), tokenData[ilkStr].decimals)
    const ltv  = Number(BLN) / Number(BigInt(liqr) / WAD)
    store.ink  = BigInt(ink)
    store.art  = urn
    store.par  = par
    store.rack = ilk.rack
    store.liqr = BigInt(liqr)
    store.feed = BigInt(feedData[0])
    store.usrGemAllowance = usrGemAllowance
    store.usrGemBal = usrGemBal
    store.debtStr = parseFloat(debt).toFixed(3)
    $('#ilkStats').textContent = `Quantity rate: ${fee}%, Min debt: ${round(dust)} Rico, LTV: ${round(ltv * 100)}%`
    $('#urnStats').textContent = `Deposited ${gemName}: ${parseFloat(inkStr).toFixed(3)}, Rico debt: ${store.debtStr}`
}

const updateDricoLabel = (container, input) => {
    if (borrowing()) {
        container.textContent = 'Borrow Rico:'
    } else {
        container.innerHTML = `Repay Rico(<input type="checkbox" id="dricoAllCheckbox">all):`
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
        let inkValue = borrowing() ? store.usrGemBal : store.ink
        let inkLongText = formatUnits(inkValue, tokenData[ilkStr].decimals)
        if(store.allInk) input.value = parseFloat(inkLongText).toFixed(3)
        updateSafetyFactor()
    })
}

const updateSafetyFactor =()=> {
    let factor = ''
    let loan, value
    if (uniMode()) {
        let art = store.art + readArt(borrowing() ? "" : "-", $('#uniDrico'))
        loan = art * store.rack / RAY * store.par / RAY

        const inkVal  = store.ink.reduce((acc, id) => acc + (store.idToVal[id]), BigInt(0));
        const dinkVal = getSelectedNfts().reduce((acc, id) => acc + (store.idToVal[id]), BigInt(0));
        value = inkVal + (borrowing() ? dinkVal : -dinkVal)
    } else {
        const sign = borrowing() ? "" : "-"
        let art = store.art + readArt(sign, $('#drico'))
        loan = art * store.rack * store.par / RAY  / RAY

        const ilk = $('input[name="ilk"]:checked').value
        let ink = store.ink + parseUnits(sign + $('#dink').value, tokenData[ilk].decimals)
        value = ink * store.feed / store.liqr
    }

    if (loan === 0n) {
        factor = '∞'
    } else {
        // get Number ratio from BN WADs which may be > maximum Number
        factor = round(Number(BLN * value / loan) / Number(BLN))
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
}

const readArt =(sign, input)=> {
    let dart
    if (store.repayAll && sign === "-")
        dart = -store.art
    else {
        const drico = parseUnits(sign + input.value, 18)
        dart = drico * RAY / store.rack
    }
    return dart
}

const frobUni = async () => {
    const sign = borrowing() ? "" : "-"
    let dink = "0x"
    const dart = readArt(sign, $('#uniDrico'))
    const nfts = getSelectedNfts()
    if (nfts.length > 0) {
        const dir = sign === "-" ? FREE : LOCK
        if (dir === LOCK && !await nfpm.read.isApprovedForAll([account, bankAddress])) {
            await nfpm.write.setApprovalForAll([bankAddress, true])
        }
        dink = encodeAbiParameters([{ name: 'dink', type: 'uint[]' }], [[dir].concat(nfts)]);
    }
    await bank.write.frob([uniIlk, account, dink, dart])
}

const frobERC20 = async () => {
    const ilk = $('input[name="ilk"]:checked').value
    const sign = borrowing() ? "" : "-"
    const dart = readArt(sign, $('#drico'))
    let dink
    if(store.allInk) {
        dink = borrowing() ? store.usrGemBal : -store.ink
    } else {
        dink = parseUnits(sign + $('#dink').value, tokenData[ilk].decimals);
    }
    if (dink > store.usrGemAllowance) {
        const {request} = await publicClient.simulateContract({
            abi: gemAbi,
            address: gems[ilk],
            functionName: 'approve',
            args: [bankAddress, MAXUINT],
            account: account,
        })
        await walletClient.writeContract(request)
    }

    if (dink < 0) dink += (BigInt(2)**BigInt(256))
    const dinkB32 = pad(toHex(dink))

    await bank.write.frob([stringToHex(ilk, {size: 32}), account, dinkB32, dart])
}

// attempt connect to injected window.ethereum. No connect button, direct wallet connect support, or dependency
const simpleConnect = async () => {
    let _account, _transport
    try {
        if (!window.ethereum) throw new Error("Ethereum wallet is not detected.");
        [_account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
        _transport = custom(window.ethereum)
    } catch (error) {
        _account = '0x' + '1'.repeat(40);
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
      chain: sepolia,
      transport: transport
    })
    publicClient = createPublicClient({
      batch: {
        multicall: true,
      },
      chain: sepolia,
      transport: http(),  // todo should replace with a dedicated RPC URL to prevent rate-limiting
    })
    const _client = {public: publicClient, wallet: walletClient}
    bank = getContract({
      address: bankAddress,
      abi: bankAbi,
      client: _client
    })
    feed = getContract({
      address: feedAddress,
      abi: feedAbi,
      client: _client
    })
    nfpm = getContract({
      address: nfpmAddress,
      abi: nfpmAbi,
      client: _client
    })
    wrap = getContract({
      address: wrapAddress,
      abi: wrapAbi,
      client: _client
    })

    $('#btnFrob').addEventListener('click', async () => {
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

    // todo update on palms

    await Promise.all([updateRicoStats(), updateHook()]);
    
    await validateConstants()
}

const maxBigInt = (a, b) => a > b ? a : b

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
