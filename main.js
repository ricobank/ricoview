import { ethers } from "ethers"
import { BigNumber, utils } from 'ethers'

const vatAddress = "0x3F18ace54E688Cd073582E1E68EAa759D69ecB61"
const voxAddress = "0x7Dfd1007fb63c0f157daDC1932888a4eA8DBd239"
const fbAddress  = "0xCa1D199b6F53Af7387ac543Af8e8a34455BBe5E0"
const vatAbi = [
    "function par() public view returns (uint)",
    "function ilks(bytes32) public view  returns (tuple(uint256 tart, uint256 rack, address fsrc, bytes32 ftag, uint256 line, uint256 dust, uint256 fee, uint256 rho, uint256 chop, uint256 liqr, address hook, address gem))",
]
const voxAbi = [
    "function way() public view returns (uint)"
]
const fbAbi  = [
    "function pull(address src, bytes32 tag) public view returns (bytes32 val, uint256 ttl)"
]
let provider, signer
let vat, vox, fb

const $ = document.querySelector.bind(document);
const BANKYEAR = ((365 * 24) + 6) * 3600
const apy =r=> round(((r / 10**27) ** BANKYEAR - 1) * 100)
const round =f=> parseFloat(f).toPrecision(4)
const stats =s=> $('#stats').textContent = s

const updateStats = async () => {
    stats(' ')
    const ilkBytes = $('input[name="ilk"]:checked').value
    $('#gem').textContent = ilkBytes
    const ilk  = await vat.ilks(utils.formatBytes32String(ilkBytes))
    const par  = utils.formatUnits((await vat.par()), 27)
    const dust = utils.formatUnits(ilk.dust, 45)
    const res = await fb.pull(ilk.fsrc, ilk.ftag)
    const mark = utils.formatUnits(BigNumber.from(res.val), 27)
    const fee  = apy(ilk.fee)
    const way  = apy(await vox.way())
    stats(`System price: ${round(par)}, Market price: ${round(mark)}, Quantity rate: ${fee}%, Price rate: ${way}%, Min debt: ${round(dust)}`)
}

window.onload = async() => {
    provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send("eth_requestAccounts", [])
    signer = provider.getSigner()

    vat = new ethers.Contract(vatAddress, vatAbi, provider)
    vox = new ethers.Contract(voxAddress, voxAbi, provider)
    fb  = new ethers.Contract(fbAddress,  fbAbi,  provider)

    $('#btnFrob').addEventListener('click', async () =>  {
        await updateStats()
    });

    document.querySelectorAll('input[name="ilk"]').forEach((elem) => {
        elem.addEventListener("change", async () => {
            await updateStats()
        });
    });

    await updateStats()
}
