import { ethers } from "ethers"
import { BigNumber, utils } from 'ethers'

const fbAddress  = "0x1dE162F7B87A9290c639f6f7bd4b3ea9a7B1a355"
const bankAddress = "0x5D00C6A7aB8614Ebc5d8E9bD79089526B1469024"

import bankABI from './bankABI.js';

const fbAbi  = [
    "function pull(address src, bytes32 tag) external view returns (bytes32 val, uint256 ttl)"
]
const gemAbi = [
    "function allowance(address, address) external view returns (uint256)",
    "function approve(address usr, uint256 wad) external payable returns (bool ok)",
    "function balanceOf(address) external view returns (uint256)"
]
const bankAbi= bankABI

const gems = {weth: "0xa9d267C3334fF4F74836DCbFAfB358d9fDf1E470", reth: "0x0", gold: "0x0"}

let provider, signer
let fb, bank
let usrGemBal, usrGemAllowance

const $ = document.querySelector.bind(document);
const BANKYEAR = ((365 * 24) + 6) * 3600
const apy =r=> round(((r / 10**27) ** BANKYEAR - 1) * 100)
const round =f=> parseFloat(f).toPrecision(4)

const updateRicoStats = async () => {
    $('#ricoStats').textContent = ' '
    const par = utils.formatUnits((await bank.par()), 27)
    const way = apy(await bank.way())
    const [tip, tag] = await bank.tip();
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
    const ilk  = await bank.ilks(utils.formatBytes32String(ilkStr))
    const fee  = apy(ilk.fee)
    const dust = utils.formatUnits(ilk.dust, 45)
    $('#ilkStats').textContent = `Quantity rate: ${fee}%, Min debt: ${round(dust)}`

    const gem = new ethers.Contract(gems[ilkStr], gemAbi, signer)
    usrGemAllowance = await gem.allowance(signer.getAddress(), bankAddress)
    usrGemBal = await gem.balanceOf(signer.getAddress())
}

// todo only considers gem hook
const getHookStats = async () => {
    const ilkStr = $('input[name="ilk"]:checked').value
    const ink  = await bank.ink(utils.formatBytes32String(ilkStr), signer.getAddress())

    const rawSrc = await bank.geth(utils.formatBytes32String(ilkStr), utils.formatBytes32String('src'), [])
    const tag = await bank.geth(utils.formatBytes32String(ilkStr), utils.formatBytes32String('tag'), [])
    const src = rawSrc.slice(2, 42);

    let mark;
    try {
        const res  = await fb.pull(src, tag)
        mark = utils.formatUnits(BigNumber.from(res.val), 27)
    } catch(e) {
        mark = -1.0
    }
    return `Feed price: ${round(mark)}, ${ilkStr} collateral: ${round(ink)}`
}

const updateUrnStats = async () => {
    const ilkStr = $('input[name="ilk"]:checked').value
    const ilk  = await bank.ilks(utils.formatBytes32String(ilkStr))
    const urn = await bank.urns(utils.formatBytes32String(ilkStr), signer.getAddress())
    const debt = utils.formatUnits(urn.mul(ilk.rack), 45)
    const hookStats = await getHookStats()
    $('#urnStats').textContent = `rico debt: ${round(debt)}, ${hookStats}`
}

window.onload = async() => {
    provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send("eth_requestAccounts", [])
    signer = provider.getSigner()
    bank = new ethers.Contract(bankAddress, bankAbi, signer)
    fb   = new ethers.Contract(fbAddress,   fbAbi,   signer)

    $('#btnFrob').addEventListener('click', async () =>  {
        const ilk = $('input[name="ilk"]:checked').value
        const sign = ($('input[name="sign"]:checked').value == "repay") ? "-" : ""
        const dink = ethers.FixedNumber.from(sign + $('#dink').value, "fixed256x18")
        const dart = utils.parseUnits(sign + $('#dart').value, 18)
        if (dink > usrGemAllowance) {
            const gem = new ethers.Contract(gems[ilk], gemAbi, signer)
            await gem.approve(bankAddress, ethers.constants.MaxUint256)
        }
        const urn = await signer.getAddress()
        const dinkB32 = utils.hexZeroPad(dink.toHexString(), 32)
        await bank.frob(utils.formatBytes32String(ilk), urn, dinkB32, dart, {gasLimit:10000000})
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
