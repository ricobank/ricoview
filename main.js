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

const marSrc = "0x2b01feaB27127DDfFEAaB057369Ddb4655b113F5"
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
const BLN = BigInt(10) ** BigInt(9)

const tokenData = {
    "mar":          { src: marSrc, tag: marTag, decimals: 0 , liqr: RAY, uniLiqr: RAY * 3n / 2n },
    "arb":          { src: arbSrc, tag: arbTag, decimals: 18, liqr: RAY, uniLiqr: RAY * 3n / 2n },
    [arb_addr]:     { src: arbSrc, tag: arbTag, decimals: 18, liqr: RAY, uniLiqr: RAY * 3n / 2n },
    "stable":       { src: stbSrc, tag: stbTag, decimals: 18, liqr: RAY, uniLiqr: RAY * 3n / 2n },
    [stable_addr]:  { src: stbSrc, tag: stbTag, decimals: 18, liqr: RAY, uniLiqr: RAY * 3n / 2n },
    "wdiveth":      { src: wdeSrc, tag: wdeTag, decimals: 18, liqr: RAY, uniLiqr: RAY * 3n / 2n },
    [wdiveth_addr]: { src: wdeSrc, tag: wdeTag, decimals: 18, liqr: RAY, uniLiqr: RAY * 3n / 2n },
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

const borrowing =()=> $('input[name="sign"]:checked').value === "borrow"
const uniMode =()=> $('input[name="ctype"]:checked').value == "UNIV3 LP NFTs"

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
    $('#dricoLabelContainer').innerHTML = $('#uniDricoLabelContainer').innerHTML = ':'

    const showUni = uniMode()
    document.getElementById("uniHook").style.display   = showUni ? "block" : "none";
    document.getElementById("erc20Hook").style.display = showUni ? "none"  : "block";
    if(showUni){
        await updateUni()
    } else {
        await updateERC20()
    }
    updateSafetyFactor()
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
    $('#uniIlkStats').textContent = `Quantity rate: ${fee}%, Min debt: ${round(dust)} rico`
    $('#uniUrnStats').textContent = `Deposited NFTS: ${store.ink}, Rico debt: ${round(debt)}`

    let usrIDs = [];
    if (borrowing()) {
        $('#NFTList').textContent= `LP NFTS to deposit:`
        const idsProm = Array.from({ length: Number(numNFTs) }, (_, i) => nfpm.read.tokenOfOwnerByIndex([account, i]));
        usrIDs = await Promise.all(idsProm);
        displayNfts(usrIDs)
    } else {
        $('#NFTList').textContent = `LP NFT IDS to withdraw:`;
        displayNfts(store.ink)
    }
    await valueNFTs([...usrIDs, ...store.ink])
}

const valueNFTs = async (nfts) => {
    const posiProms = nfts.map(async nft => {
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
    const valProms = positions.map(async pos => {
        const sqrtPriceX96 = sqrt(gemToPrice[pos[t1]] * X96 * X96 / gemToPrice[pos[t0]])
        const [amt0, amt1] = await wrap.read.total([nfpmAddress, pos[id], sqrtPriceX96])
        const liqr = maxBigInt(tokenData[pos[t0]].uniLiqr, tokenData[pos[t1]].uniLiqr)
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
    $('#gem').textContent = borrowing() ? `${gemName} to deposit:` : `${gemName} to withdraw:`
    updateDricoLabel($('#dricoLabelContainer'), $('#drico'))

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
        feed.read.pull([tokenData[ilkStr].src, tokenData[ilkStr].tag]),
    ])

    const fee  = apy(ilk.fee)
    const dust = formatUnits(ilk.dust, 45)
    const mark = formatUnits(BigInt(feedData[0]), 27)
    const debt = formatUnits(urn * ilk.rack, 45)
    const inkStr = formatUnits(BigInt(ink), tokenData[ilkStr].decimals)
    store.ink  = BigInt(ink)
    store.art  = urn
    store.par  = par
    store.rack = ilk.rack
    store.liqr = BigInt(liqr)
    store.feed = BigInt(feedData[0])
    store.usrGemAllowance = usrGemAllowance
    store.usrGemBal = usrGemBal
    $('#ilkStats').textContent = `Quantity rate: ${fee}%, Min debt: ${round(dust)} rico, Feed price: ${round(mark)}`
    $('#urnStats').textContent = `Deposited ${gemName}: ${round(inkStr)}, Rico debt: ${round(debt)}`
}

const updateDricoLabel = (container, input) => {
    if (borrowing()) {
        container.textContent = `RICO to borrow:`
    } else {
        container.innerHTML = `Repay RICO(<input type="checkbox" id="dricoAllCheckbox">all):`
        $('#dricoAllCheckbox').addEventListener('change', (event) => {
            store.repayAll = input.disabled = event.target.checked
            updateSafetyFactor();
        })
    }
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

        let ink = store.ink + parseUnits(sign + $('#dink').value, $('input[name="ilk"]:checked').value)
        value = ink * store.feed / store.liqr
    }

    if (loan === 0n) {
        factor = 'safe'
    } else {
        // get Number ratio from BN WADs which may be > maximum Number
        factor = round(Number(BLN * value / loan) / Number(BLN))
    }

    $('#safetyFactor').textContent = `New safety factor: ${factor}`
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
    let dink = parseUnits(sign + $('#dink').value, tokenData[ilk].decimals);
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