import { ethers } from "ethers"
import { BigNumber, utils } from 'ethers'

const vatAddress = "0x108405098F70D0bdc244eB4f30c0226Fc7f2e4D2"
const voxAddress = "0x0a43f18212F0642c59797F73C684F291F54A3Ff6"
const fbAddress  = "0xaB6cC116256f53f5468601aE3dB92b1745DA66eE"
const erc20HookAddress = "0x29A953B1F6447B0Da0c6cF6a6E853FB172D0fe76"

const vatAbi = [
    "function par() public view returns (uint)",
    "function ilks(bytes32) public view  returns (tuple(uint256 tart, uint256 rack, uint256 line, uint256 dust, uint256 fee, uint256 rho, uint256 chop, uint256 liqr, address hook))",
    "function frob(bytes32 i, address u, bytes memory dink, int256 dart)",
    "function urns(bytes32 ilk, address usr) external view returns (uint256 art)"
]
const voxAbi = [
    "function way() external view returns (uint256)",
    "function tip() external view returns (address)",
    "function tag() external view returns (bytes32)"
]
const fbAbi  = [
    "function pull(address src, bytes32 tag) external view returns (bytes32 val, uint256 ttl)"
]
const gemAbi = [
    "function allowance(address, address) external view returns (uint256)",
    "function approve(address usr, uint256 wad) external payable returns (bool ok)",
    "function balanceOf(address) external view returns (uint256)"
]
const erc20HookAbi = [
    "function items(bytes32 ilk) external view returns (address gem, address fsrc, bytes32 ftag)",
    "function inks(bytes32 ilk, address usr) external view returns (uint256)"
]
const gems = {weth: "0xa9d267C3334fF4F74836DCbFAfB358d9fDf1E470", reth: "0x0", gold: "0x0"}


const bn = (n) => ethers.BigNumber.from(n)
const bn2b32 = (bn) => ethers.utils.hexZeroPad(bn.toHexString(), 32)

let provider, signer
let vat, vox, fb, erc20Hook
let usrGemBal, usrGemAllowance

const $ = document.querySelector.bind(document);
const BANKYEAR = ((365 * 24) + 6) * 3600
const apy =r=> round(((r / 10**27) ** BANKYEAR - 1) * 100)
const round =f=> parseFloat(f).toPrecision(4)

const updateRicoStats = async () => {
    $('#ricoStats').textContent = ' '
    const par = utils.formatUnits((await vat.par()), 27)
    const way = apy(await vox.way())
    const tip = await vox.tip()
    const tag = await vox.tag()
    let mar
    try {
        const res = await fb.pull(tip, tag)
        mar = utils.formatUnits(BigNumber.from(res.val), 27)
    } catch (e) {
        console.log(`failed to read market price of rico with tip ${tip} and tag ${tag}`)
        console.log(e)
        mar = -1.0
    }
    $('#ricoStats').textContent = `Rico system price: ${round(par)}, market price: ${round(mar)}, Price rate: ${way}%`
}

const updateIlkStats = async () => {
    $('#ilkStats').textContent = ' '
    const ilkStr = $('input[name="ilk"]:checked').value
    $('#gem').textContent = ilkStr
    const ilk  = await vat.ilks(utils.formatBytes32String(ilkStr))
    const fee  = apy(ilk.fee)
    const dust = utils.formatUnits(ilk.dust, 45)
    $('#ilkStats').textContent = `Quantity rate: ${fee}%, Min debt: ${round(dust)}`

    const gem = new ethers.Contract(gems[ilkStr], gemAbi, signer)
    usrGemAllowance = await gem.allowance(signer.getAddress(), erc20HookAddress)
    usrGemBal = await gem.balanceOf(signer.getAddress())
}

// todo only considers gem hook
const getHookStats = async () => {
    const ilkStr = $('input[name="ilk"]:checked').value
    const ink  = await erc20Hook.inks( utils.formatBytes32String(ilkStr), signer.getAddress())
    const item = await erc20Hook.items(utils.formatBytes32String(ilkStr))
    let mark;
    try {
        const res  = await fb.pull(item.fsrc, item.ftag)
        mark = utils.formatUnits(BigNumber.from(res.val), 27)
    } catch(e) {
        console.log(`unable to read market val for item ${item}`)
        mark = -1.0
    }
    return `Feed price: ${round(mark)}, ${ilkStr} collateral: ${round(ink)}`
}

const updateUrnStats = async () => {
    const ilkStr = $('input[name="ilk"]:checked').value
    const ilk  = await vat.ilks(utils.formatBytes32String(ilkStr))
    const urn = await vat.urns(utils.formatBytes32String(ilkStr), signer.getAddress())
    const debt = utils.formatUnits(urn.mul(ilk.rack), 45)
    const hookStats = await getHookStats()
    $('#urnStats').textContent = `rico debt: ${round(debt)}, ${hookStats}`
}

window.onload = async() => {
    provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send("eth_requestAccounts", [])
    signer = provider.getSigner()

    vat       = new ethers.Contract(vatAddress, vatAbi, signer)
    vox       = new ethers.Contract(voxAddress, voxAbi, signer)
    fb        = new ethers.Contract(fbAddress,  fbAbi,  signer)
    erc20Hook = new ethers.Contract(erc20HookAddress, erc20HookAbi, signer)

    $('#btnFrob').addEventListener('click', async () =>  {
        const ilk = $('input[name="ilk"]:checked').value
        const sign = ($('input[name="sign"]:checked').value == "repay") ? "-" : ""
        const dink = ethers.FixedNumber.from(sign + $('#dink').value, "fixed256x18")
        const dart = utils.parseUnits(sign + $('#dart').value, 18)
        if (dink > usrGemAllowance) {
            const gem = new ethers.Contract(gems[ilk], gemAbi, signer)
            await gem.approve(erc20HookAddress, ethers.constants.MaxUint256)
        }
        const urn = await signer.getAddress()
        const dinkB32 = utils.hexZeroPad(dink.toTwos(256).toHexString(), 32)
        await vat.frob(utils.formatBytes32String(ilk), urn, dinkB32, dart, {gasLimit:10000000})
        await updateUrnStats()
    });

    document.querySelectorAll('input[name="ilk"]').forEach((elem) => {
        elem.addEventListener("change", async () => {
            await updateIlkStats()
        });
    });

    await updateRicoStats()
    await updateIlkStats()
    await updateUrnStats()
}
