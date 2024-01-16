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

const marSrc = "0x20A3e14b06DCD8Fd8eC582acC1cE1A08b698fa8e"
const marTag = "0x7269636f3a726566000000000000000000000000000000000000000000000000"
const arbSrc = "0x20a3e14b06dcd8fd8ec582acc1ce1a08b698fa8e"
const arbTag = "0x6172623a72656600000000000000000000000000000000000000000000000000"
const wdeSrc = "0x20a3e14b06dcd8fd8ec582acc1ce1a08b698fa8e"
const wdeTag = "0x776469766574683a726566000000000000000000000000000000000000000000"
const stbSrc = "0x20a3e14b06dcd8fd8ec582acc1ce1a08b698fa8e"
const stbTag = "0x737461626c653a72656600000000000000000000000000000000000000000000"

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

const RAY = BigInt(10) ** BigInt(27)

const tokenData = {
    "mar":          { src: marSrc, tag: marTag, decimals: 0 , liqr: RAY, uniLiqr: RAY },
    "arb":          { src: arbSrc, tag: arbTag, decimals: 18, liqr: RAY, uniLiqr: RAY },
    [arb_addr]:     { src: arbSrc, tag: arbTag, decimals: 18, liqr: RAY, uniLiqr: RAY },
    "stable":       { src: stbSrc, tag: stbTag, decimals: 18, liqr: RAY, uniLiqr: RAY },
    [stable_addr]:  { src: stbSrc, tag: stbTag, decimals: 18, liqr: RAY, uniLiqr: RAY },
    "wdiveth":      { src: wdeSrc, tag: wdeTag, decimals: 18, liqr: RAY, uniLiqr: RAY },
    [wdiveth_addr]: { src: wdeSrc, tag: wdeTag, decimals: 18, liqr: RAY, uniLiqr: RAY },
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

let account, publicClient, walletClient
let usrGemBal, usrGemAllowance
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

const borrowing = () => $('input[name="sign"]:checked').value === "borrow"

const updateRicoStats = async () => {
    const ricoStats = $('#ricoStats');
    ricoStats.textContent = ' '
    const [parRay, wayRay, feedData] = await Promise.all([
        bank.read.par(),
        bank.read.way(),
        feed.read.pull([tokenData["mar"].src, tokenData["mar"].tag])
    ]);
    const par = formatUnits(parRay, 27)
    const way = apy(wayRay)
    const mar = formatUnits(BigInt(feedData[0]), 27)
    ricoStats.textContent = `Rico system price: ${round(par)}, Price rate: ${way}%, market price: ${round(mar)}`
}

const updateHook = async () => {
    store = {}

    const showUni = $('input[name="ctype"]:checked').value == "UNIV3 LP NFTs"
    document.getElementById("uniHook").style.display   = showUni ? "block" : "none";
    document.getElementById("erc20Hook").style.display = showUni ? "none"  : "block";
    if(showUni){
        await updateUni()
    } else {
        await Promise.all([updateERC20IlkStats(), updateERC20UrnStats()])
    }
}

const updateUni = async () => {
    const NFTsContainer  = $('#nftContainer')
    const limitContainer = $('#limitContainer')
    NFTsContainer.innerHTML = '';
    limitContainer.innerHTML = '';
    $('#uniDrico').disabled = false

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
    $('#uniIlkStats').textContent = `Quantity rate: ${fee}%, Min debt: ${round(dust)} rico`
    $('#uniUrnStats').textContent = `Rico debt: ${round(debt)}`

    // either get deposited ink, or users own available NFTs
    if (borrowing()) {
        $('#NFTList').textContent     = `LP NFTS to deposit:`
        $('#RicoAmount').textContent  = `RICO to borrow:`
        $('#ActionLimit').textContent = `Max new borrow:`
        const idsProm = Array.from({ length: Number(numNFTs) }, (_, i) => nfpm.read.tokenOfOwnerByIndex([account, i]));
        const ids = await Promise.all(idsProm);
        displayNfts(ids)
        await updateUniBorrowLimit()
    } else {
        $('#NFTList').textContent     = `LP NFTS to withdraw:`;
        $('#RicoAmount').textContent  = `RICO to repay:`
        $('#ActionLimit').textContent = `Repay all:`

        const checkbox = document.createElement('input');
        checkbox.setAttribute('type', 'checkbox')
        checkbox.setAttribute('id', 'uniRepayAll')
        limitContainer.appendChild(checkbox)
        checkbox.addEventListener('change', (event) => {
            store.uniRepayAll = $('#uniDrico').disabled = event.target.checked
        })

        const uniInk = await bank.read.ink([uniIlk, account])
        const ids = decodeAbiParameters([{ name: 'ink', type: 'uint[]' }], uniInk)[0]
        displayNfts(ids)
    }
}

const updateUniBorrowLimit = async () => {
    const allInk = [...getSelectedNfts(), ...store.ink];
    const posiProms = allInk.map(async nft => {
        const positions = await nfpm.read.positions([nft]);
        return [...positions, nft];
    });
    const positions = await Promise.all(posiProms);
    const tokens    = new Set(positions.flatMap(pos => [pos[t0], pos[t1]]))
    const feedProms = Array.from(tokens).map(async tok => {
        const [val,] = await feed.read.pull([tokenData[tok].src, tokenData[tok].tag])
        return [tok, hexToBigInt(val, { size: 32 })]
    })
    const prices = await Promise.all(feedProms)
    const gemToPrice = Object.fromEntries(prices)
    const limitProms = positions.map(async pos => {
        const sqrtPriceX96 = sqrt(gemToPrice[pos[t1]] * X96 * X96 / gemToPrice[pos[t0]])
        const [amt0, amt1] = await wrap.read.total([nfpmAddress, pos[id], sqrtPriceX96])
        const liqr = maxBigInt(tokenData[pos[t0]].uniLiqr, tokenData[pos[t1]].uniLiqr)
        return (amt0 * gemToPrice[pos[t0]] + amt1 * gemToPrice[pos[t1]]) / liqr
    })
    const vals = await Promise.all(limitProms)
    const maxVal = vals.reduce((acc, val) => acc + val, BigInt(0))
    const maxRico = maxVal * RAY / store.par
    const limit = maxRico - (store.art * store.rack / RAY)

    const container = document.getElementById('limitContainer');
    container.textContent = `${parseFloat(formatUnits(limit, 18)).toFixed(4)}`;
}

// todo this displays checkboxes for each uni nft with token IDs for labels
// ~"symbol/symbol [min price, max price]" could be better. Or people can find id in uni app
// should also filter positions with at least one unsupported tok
function displayNfts(nftIds) {
    const container = document.getElementById('nftContainer');

    nftIds.forEach(id => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `nft-${id}`;
        checkbox.value = id;

        const label = document.createElement('label');
        label.htmlFor = `nft-${id}`;
        label.textContent = `NFT ID: ${id}`;

        const div = document.createElement('div');
        div.style.marginRight = '10px'
        div.appendChild(checkbox);
        div.appendChild(label);

        container.appendChild(div);
    });

    document.querySelectorAll('#nftContainer input[type="checkbox"]').forEach((elem) => {
        elem.addEventListener("change", async () => {
            await onNFTSelection();
        });
    });
}

function getSelectedNfts() {
    const checkboxes = document.querySelectorAll('#nftContainer input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(checkbox => BigInt(checkbox.value));
}

const onNFTSelection = async () => {
    if (borrowing()) {
        await updateUniBorrowLimit()
    }
}

const updateERC20IlkStats = async () => {
    const ilkStats = $('#ilkStats');
    ilkStats.textContent = ' '
    const ilkStr = $('input[name="ilk"]:checked').value
    const ilkHex = stringToHex(ilkStr, {size: 32})

    const gemName = strToDisplay[ilkStr]
    if (borrowing()) {
        $('#gem').textContent  = `${gemName} to deposit:`
        $('#drico').textContent = `RICO to borrow:`
    } else {
        $('#gem').textContent  =  `${gemName} to withdraw:`;
        $('#drico').textContent = `RICO to repay:`
    }

    let ilk
    [ilk, usrGemAllowance, usrGemBal] = await Promise.all([
        bank.read.ilks([ilkHex]),
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
        })
    ])

    const fee  = apy(ilk.fee)
    const dust = formatUnits(ilk.dust, 45)
    ilkStats.textContent = `Quantity rate: ${fee}%, Min debt: ${round(dust)} rico`
}

const updateERC20UrnStats = async () => {
    const ilkStr = $('input[name="ilk"]:checked').value
    const symStr = strToDisplay[ilkStr]
    const ilkHex = stringToHex(ilkStr, {size: 32})

    const [ilk, urn, ink, feedData] = await Promise.all([
      bank.read.ilks([ilkHex]),
      bank.read.urns([ilkHex, account]),
      bank.read.ink( [ilkHex, account]),
      feed.read.pull([tokenData[ilkStr].src, tokenData[ilkStr].tag]),
    ])

    const debt = formatUnits(urn * ilk.rack, 45)
    const inkStr = formatUnits(BigInt(ink), tokenData[ilkStr].decimals)
    const mark = formatUnits(BigInt(feedData[0]), 27)
    $('#urnStats').textContent =
        `Rico debt: ${round(debt)}, Feed price: ${round(mark)}, ${symStr} collateral: ${round(inkStr)}`
}

const frobUni = async () => {
    const sign = borrowing() ? "" : "-"
    let dink = "0x"
    let dart
    if (store.uniRepayAll && sign === "-")
        dart = -store.art
    else {
        const drico = parseUnits(sign + $('#uniDrico').value, 18)
        dart = drico * RAY / store.rack
    }
    const nfts = getSelectedNfts()

    if (nfts.length > 0) {
        const dir = sign === "-" ? FREE : LOCK
        if (dir === LOCK && !await nfpm.read.isApprovedForAll([account, bankAddress])) {
            await nfpm.write.setApprovalForAll([bankAddress, true])
        }
        dink = encodeAbiParameters([{ name: 'dink', type: 'uint[]' }], [[dir].concat(nfts)]);
    }

    await bank.write.frob([uniIlk, account, dink, dart])
    await updateHook()
}

const frobERC20 = async () => {
    const ilk = $('input[name="ilk"]:checked').value
    const sign = borrowing() ? "" : "-"
    let dink = parseUnits(sign + $('#dink').value, tokenData[ilk].decimals);
    const dart = parseUnits(sign + $('#dart').value, 18)
    if (dink > usrGemAllowance) {
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
    await updateERC20UrnStats()
}

const validateConstants = async () => {
    // todo after page is loaded read values from chain and compare to hardcoded if running from saved file
    //  warn and disable if saved page needs updating
    if (window.location.protocol === 'file:') {
        // bank.read.tip()
        // bank.read.geth([ilkHex, stringToHex('src', {size: 32}), []]),
        // etc
    }
}

window.onload = async() => {
    // todo manage connection, allow to proceed in some ways before connected. test with frame, rabby, coinbase wallet
    [account] = await window.ethereum.request({ method: 'eth_requestAccounts' })
    walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: custom(window.ethereum)
    })
    publicClient = createPublicClient({
      batch: {
        multicall: true,
      },
      chain: sepolia,
      transport: http(),
    })

    bank = getContract({
      address: bankAddress,
      abi: bankAbi,
      client: {
          public: publicClient,
          wallet: walletClient,
      }
    })
    feed = getContract({
      address: feedAddress,
      abi: feedAbi,
      client: {
          public: publicClient,
          wallet: walletClient,
      }
    })
    nfpm = getContract({
      address: nfpmAddress,
      abi: nfpmAbi,
      client: {
          public: publicClient,
          wallet: walletClient,
      }
    })
    wrap = getContract({
      address: wrapAddress,
      abi: wrapAbi,
      client: {
          public: publicClient,
          wallet: walletClient,
      }
    })

    $('#btnFrob').addEventListener('click', async () => {
        if ($('input[name="ctype"]:checked').value == "UNIV3 LP NFTs") {
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