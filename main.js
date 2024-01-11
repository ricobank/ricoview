import { createPublicClient, createWalletClient, custom, decodeAbiParameters, encodeAbiParameters, formatUnits,
    getContract, http, pad, parseAbi, parseUnits, stringToHex, toHex } from 'viem'  // todo update to viem 2.0
import { sepolia } from 'viem/chains'

// sepolia addresses
const bankAddress   = "0x343d30cCCe6c02987329C4fE2664E20F0aD39aa2"
const feedAddress   = "0x16Bb244cd38C2B5EeF3E5a1d5F7B6CC56d52AeF3"
const nfpmAddress   = "0x1238536071E1c677A632429e3655c799b22cDA52"
const rico_addr     = "0x6c9BFDfBbAd23418b5c19e4c7aF2f926ffAbaDfa"
const dai_addr      = "0x290eCE67DDA5eEc618b3Bb5DF04BE96f38894e29"

const arb_addr      = "0x3c6765dd58D75786CD2B20968Aa13beF2a1D85B8"
const stable_addr   = "0x698DEE4d8b5B9cbD435705ca523095230340D875"
const wdiveth_addr  = "0x69619b71b52826B93205299e33259E1547ff3331"

const marSrc = "0x20A3e14b06DCD8Fd8eC582acC1cE1A08b698fa8e"
const marTag = "0x7269636f3a726566000000000000000000000000000000000000000000000000"
const arbSrc = "0x20a3e14b06dcd8fd8ec582acc1ce1a08b698fa8e"
const arbTag = "0x6172623a72656600000000000000000000000000000000000000000000000000"
const wdeSrc = "0x20a3e14b06dcd8fd8ec582acc1ce1a08b698fa8e"
const wdeTag = "0x776469766574683a726566000000000000000000000000000000000000000000"
const stbSrc = "0x20a3e14b06dcd8fd8ec582acc1ce1a08b698fa8e"
const stbTag = "0x737461626c653a72656600000000000000000000000000000000000000000000"

const gems = {
    arb:     arb_addr,
    wdiveth: wdiveth_addr,
    stable:  stable_addr
}

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

// todo mainly unused, should use something like this to avoid multiple roundtrips reading state to use to read state
const tokenData = {
    "mar":     { src: marSrc, tag: marTag, decimals: 0  },

    "arb":     { src: arbSrc, tag: arbTag, decimals: 18 },
    "wdiveth": { src: wdeSrc, tag: wdeTag, decimals: 18 },
    "stable":  { src: stbSrc, tag: stbTag, decimals: 18 },
};

import BankDiamond from './BankDiamond.json';
const bankAbi = BankDiamond.abi

let account, publicClient, walletClient
let usrGemBal, usrGemAllowance
let bank, nfpm, feed

const $ = document.querySelector.bind(document);
const BANKYEAR = ((365 * 24) + 6) * 3600
const MAXUINT  = BigInt(2)**BigInt(256) - BigInt(1);
const FREE = MAXUINT  // -1
const LOCK = BigInt(1)
const apy =r=> round(((Number(r) / 10**27) ** BANKYEAR - 1) * 100)
const round =f=> parseFloat(f).toPrecision(4)

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
    const container = document.getElementById('nftContainer');
    container.innerHTML = '';
    // either get deposited ink, or users own available NFTs
    if ($('input[name="sign"]:checked').value == "borrow") {
        document.getElementById("NFTList").textContent    = `LP NFTS to deposit:`
        document.getElementById("RicoAmount").textContent = `RICO to borrow:`

        const [numNFTs, ilk] = await Promise.all([
            nfpm.read.balanceOf([account]),
            bank.read.ilks([uniIlk]),
        ])
        const fee  = apy(ilk.fee)
        const dust = formatUnits(ilk.dust, 45)
        // todo should also show liqr or cratio, or show max borrow. same w erc20
        $('#uniIlkStats').textContent = `Quantity rate: ${fee}%, Min debt: ${round(dust)} rico`

        const idsProm = Array.from({ length: Number(numNFTs) }, (_, i) => nfpm.read.tokenOfOwnerByIndex([account, i]));
        const ids = await Promise.all(idsProm);
        displayNfts(ids)
    } else {
        // get ink from bank
        document.getElementById("NFTList").textContent = `LP NFTS to withdraw:`;
        document.getElementById("RicoAmount").textContent = `RICO to repay:`
        const uniInk = await bank.read.ink([uniIlk, account])
        const ids = decodeAbiParameters([{ name: 'ink', type: 'uint[]' }], uniInk)[0]
        displayNfts(ids)
    }
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
}

function getSelectedNfts() {
    const checkboxes = document.querySelectorAll('#nftContainer input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(checkbox => BigInt(checkbox.value));
}

const updateERC20IlkStats = async () => {
    const ilkStats = $('#ilkStats');
    ilkStats.textContent = ' '
    const ilkStr = $('input[name="ilk"]:checked').value
    const ilkHex = stringToHex(ilkStr, {size: 32})
    $('#gem').textContent = ilkStr
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
        `rico debt: ${round(debt)}, Feed price: ${round(mark)}, ${ilkStr} collateral: ${round(inkStr)}`
}

const frobUni = async () => {
    const sign = ($('input[name="sign"]:checked').value == "repay") ? "-" : ""
    let dink = "0x"
    const dart = parseUnits(sign + $('#uniDart').value, 18)
    const nfts = getSelectedNfts()

    if (nfts.length > 0) {
        const dir = sign === "-" ? FREE : LOCK
        if (dir === LOCK && !await nfpm.read.isApprovedForAll([account, bankAddress])) {
            await nfpm.write.setApprovalForAll([bankAddress, true])
        }
        dink = encodeAbiParameters([{ name: 'dink', type: 'uint[]' }], [[dir].concat(nfts)]);
    }

    // const { request } = await bank.simulate.frob([uniIlk, account, dink, dart], {gasLimit:10_000_000, from: account})
    // await walletClient.writeContract(request)
    await bank.write.frob([uniIlk, account, dink, dart])

    await updateHook()
}

const frobERC20 = async () => {
    const ilk = $('input[name="ilk"]:checked').value
    const sign = ($('input[name="sign"]:checked').value == "repay") ? "-" : ""
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
      publicClient: publicClient,
      walletClient: walletClient
    })
    feed = getContract({
      address: feedAddress,
      abi: feedAbi,
      publicClient: publicClient,
      walletClient: walletClient
    })
    nfpm = getContract({
      address: nfpmAddress,
      abi: nfpmAbi,
      publicClient: publicClient,
      walletClient: walletClient
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
