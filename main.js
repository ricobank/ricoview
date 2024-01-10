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

const ricorisk_addr = "0x5dD4Ff6070629F879353d02fFdA3404085298669"
const ricodai_addr  = "0x6443Da3Df6DAE6F33e53611f31ec90d101Bf7FbF"

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
    "arb":     { src: "0x111", tag: "tag", decimals: 18 },
    "wdiveth": { src: "0x111", tag: "tag", decimals: 18 },
    "stable":  { src: "0x111", tag: "tag", decimals: 18 },
};

import BankDiamond from './BankDiamond.json';
const bankAbi = BankDiamond.abi

const fbConfig = {
    address: feedAddress,
    abi: feedAbi
}

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
    $('#ricoStats').textContent = ' '

    const [parRay, wayRay, tipData] = await Promise.all([
        bank.read.par(),
        bank.read.way(),
        bank.read.tip(),
    ]);
    const { src, tag } = tipData;

    const par = formatUnits(parRay, 27)
    const way = apy(wayRay)
    let mar
    try {
        const [val, ttl] = await publicClient.readContract({...fbConfig, functionName: 'pull', args: [src, tag]})
        mar = formatUnits(BigInt(val), 27)
    } catch (e) {
        console.log(`failed to read market price of rico with src ${src} and tag ${tag}`)
        console.log(e)
        mar = -1.0
    }
    $('#ricoStats').textContent = `Rico system price: ${round(par)}, Price rate: ${way}%, market price: ${round(mar)}`
}

const updateHook = async () => {
    const showUni = $('input[name="ctype"]:checked').value == "UNIV3 LP NFTs"
    document.getElementById("uniHook").style.display   = showUni ? "flex" : "none";
    document.getElementById("erc20Hook").style.display = showUni ? "none"  : "block";
    if(showUni){
        await updateUni()
    } else {
        await updateERC20IlkStats()
        await updateERC20UrnStats()
    }
}

const updateUni = async () => {
    const container = document.getElementById('nftContainer');
    container.innerHTML = '';
    // either get deposited ink, or users own available NFTs
    if ($('input[name="sign"]:checked').value == "borrow") {
        document.getElementById("NFTList").textContent    = `LP NFTS to deposit:`
        document.getElementById("RicoAmount").textContent = `RICO to borrow:`
        const numNFTs = await nfpm.read.balanceOf([account])
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
    $('#ilkStats').textContent = ' '
    const ilkStr = $('input[name="ilk"]:checked').value
    const ilkHex = stringToHex(ilkStr, {size: 32})
    $('#gem').textContent = ilkStr
    const ilk  = await bank.read.ilks([ilkHex])
    const fee  = apy(ilk.fee)
    const dust = formatUnits(ilk.dust, 45)
    $('#ilkStats').textContent = `Quantity rate: ${fee}%, Min debt: ${round(dust)} rico`

    // todo 3 serial waits, replace with single viem multicall "await publicClient.multicall..."
    // or at least concurrent promise group
    usrGemAllowance = await publicClient.readContract({
        address: gems[ilkStr],
        abi: gemAbi,
        functionName: 'allowance',
        args: [account, bankAddress]
    })
    usrGemBal = await publicClient.readContract({
        address: gems[ilkStr],
        abi: gemAbi,
        functionName: 'balanceOf',
        args: [account]
    })
}

const getHookStats = async () => {
    const ilkStr = $('input[name="ilk"]:checked').value
    const ilkHex = stringToHex(ilkStr, {size: 32})

    const [ink, rawSrc, tag] = await Promise.all([
      bank.read.ink( [ilkHex, account]),
      bank.read.geth([ilkHex, stringToHex('src', {size: 32}), []]),
      bank.read.geth([ilkHex, stringToHex('tag', {size: 32}), []]),
    ])
    const inkStr = formatUnits(BigInt(ink), tokenData[ilkStr].decimals)
    // todo use tokenData{} to get src, tag and reduce to one fetch
    const src = rawSrc.slice(0, 42);
    let mark;
    try {
        const [val, ttl] = await publicClient.readContract({...fbConfig, functionName: 'pull', args: [src, tag]})
        mark = formatUnits(BigInt(val), 27)
    } catch(e) {
        console.log(e)
        mark = -1.0
    }
    return `Feed price: ${round(mark)}, ${ilkStr} collateral: ${round(inkStr)}`
}

const updateERC20UrnStats = async () => {
    const ilkStr = $('input[name="ilk"]:checked').value
    const ilkHex = stringToHex(ilkStr, {size: 32})

    const [ilk, urn] = await Promise.all([
      bank.read.ilks([ilkHex]),
      bank.read.urns([ilkHex, account]),
    ])

    const debt = formatUnits(urn * ilk.rack, 45)
    const hookStats = await getHookStats()
    $('#urnStats').textContent = `rico debt: ${round(debt)}, ${hookStats}`
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

    if (dink < 0) dink += MAXUINT
    const dinkB32 = pad(toHex(dink))

    await bank.write.frob([stringToHex(ilk, {size: 32}), account, dinkB32, dart])
    await updateERC20UrnStats()
}

window.onload = async() => {
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

    document.querySelectorAll('input[name="ctype"]').forEach((elem) => {
        elem.addEventListener("change", async () => {
            await updateHook()
        });
    });
    document.querySelectorAll('input[name="sign"]').forEach((elem) => {
        elem.addEventListener("change", async () => {
            await updateHook()
        });
    });
    document.querySelectorAll('input[name="ilk"]').forEach((elem) => {
        elem.addEventListener("change", async () => {
            await updateERC20IlkStats()
        });
    });
    // todo update on palms

    await Promise.all([updateRicoStats(), updateHook()]);
}
