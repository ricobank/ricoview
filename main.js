import { createPublicClient, createWalletClient, custom, formatUnits, http, parseAbi, stringToHex, toHex } from 'viem'
import { arbitrumGoerli } from 'viem/chains'

const fbAddress  = "0x1dE162F7B87A9290c639f6f7bd4b3ea9a7B1a355"
const bankAddress = "0x5D00C6A7aB8614Ebc5d8E9bD79089526B1469024"

const fbAbi  = parseAbi([
    "function pull(address src, bytes32 tag) external view returns (bytes32 val, uint256 ttl)"
])
const gemAbi = parseAbi([
    "function allowance(address, address) external view returns (uint256)",
    "function approve(address usr, uint256 wad) external payable returns (bool ok)",
    "function balanceOf(address) external view returns (uint256)"
])

import BankDiamond from './BankDiamond.json';
const bankAbi = BankDiamond.abi

const gems = {weth: "0xa9d267C3334fF4F74836DCbFAfB358d9fDf1E470", reth: "0x0", gold: "0x0"}

const bankConfig = {
    address: bankAddress,
    abi: bankAbi
};
const fbConfig = {
    address: fbAddress,
    abi: fbAbi
}

let account, clientPub, clientWal
let usrGemBal, usrGemAllowance

const $ = document.querySelector.bind(document);
const BANKYEAR = ((365 * 24) + 6) * 3600
const MAXUINT  = BigInt(2)**BigInt(256) - BigInt(1);
const apy =r=> round(((Number(r) / 10**27) ** BANKYEAR - 1) * 100)
const round =f=> parseFloat(f).toPrecision(4)

const updateRicoStats = async () => {
    $('#ricoStats').textContent = ' '
    const parRay = await clientPub.readContract({...bankConfig, functionName: 'par'})
    const par = formatUnits(parRay, 27)
    const wayRay = await clientPub.readContract({...bankConfig, functionName: 'way'})
    const way = apy(wayRay)
    const {src, tag} = await clientPub.readContract({...bankConfig, functionName: 'tip'})
    let mar
    try {
        const [val, ttl] = await clientPub.readContract({...fbConfig, functionName: 'pull', args: [src, tag]})
        mar = formatUnits(BigInt(val), 27)
    } catch (e) {
        console.log(`failed to read market price of rico with src ${src} and tag ${tag}`)
        console.log(e)
        mar = -1.0
    }
    $('#ricoStats').textContent = `Rico system price: ${round(par)}, market price: ${round(mar)}, Price rate: ${way}%`
}

const updateIlkStats = async () => {
    $('#ilkStats').textContent = ' '
    const ilkStr = $('input[name="ilk"]:checked').value
    const ilkHex = stringToHex(ilkStr, {size: 32})
    $('#gem').textContent = ilkStr
    const ilk  = await clientPub.readContract({...bankConfig,
                                            functionName: 'ilks',
                                            args: [ilkHex]})
    const fee  = apy(ilk.fee)
    const dust = formatUnits(ilk.dust, 45)
    $('#ilkStats').textContent = `Quantity rate: ${fee}%, Min debt: ${round(dust)}`

    usrGemAllowance = await clientPub.readContract({
        address: gems[ilkStr],
        abi: gemAbi,
        functionName: 'allowance',
        args: [account, bankAddress]
    })
    usrGemBal = await clientPub.readContract({
        address: gems[ilkStr],
        abi: gemAbi,
        functionName: 'balanceOf',
        args: [account]
    })
}

const getHookStats = async () => {
    const ilkStr = $('input[name="ilk"]:checked').value
    const ilkHex = stringToHex(ilkStr, {size: 32})
    const ink = await clientPub.readContract({...bankConfig,
                                           functionName: 'ink',
                                           args: [ilkHex, account]})
    const rawSrc = await clientPub.readContract({...bankConfig,
                                              functionName: 'geth',
                                              args: [ilkHex, stringToHex('src', {size: 32}), []]})
    const tag    = await clientPub.readContract({...bankConfig,
                                              functionName: 'geth',
                                              args: [ilkHex, stringToHex('tag', {size: 32}), []]})
    const src = rawSrc.slice(0, 42);

    let mark;
    try {
        const [val, ttl] = await clientPub.readContract({...fbConfig, functionName: 'pull', args: [src, tag]})
        mark = formatUnits(BigInt(val), 27)
    } catch(e) {
        console.log(e)
        mark = -1.0
    }
    return `Feed price: ${round(mark)}, ${ilkStr} collateral: ${round(ink)}`
}

const updateUrnStats = async () => {
    const ilkStr = $('input[name="ilk"]:checked').value
    const ilkHex = stringToHex(ilkStr, {size: 32})
    const ilk  = await clientPub.readContract({...bankConfig,
                                            functionName: 'ilks',
                                            args: [ilkHex]})
    const urn  = await clientPub.readContract({...bankConfig,
                                            functionName: 'urns',
                                            args: [ilkHex, account]})
    const debt = formatUnits(urn * ilk.rack, 45)
    const hookStats = await getHookStats()
    $('#urnStats').textContent = `rico debt: ${round(debt)}, ${hookStats}`
}

window.onload = async() => {
    [account] = await window.ethereum.request({ method: 'eth_requestAccounts' })
    clientWal = createWalletClient({
      account,
      chain: arbitrumGoerli,
      transport: custom(window.ethereum)
    })
    clientPub = createPublicClient({
      batch: {
        multicall: true,
      },
      chain: arbitrumGoerli,
      transport: http(),
})

    $('#btnFrob').addEventListener('click', async () =>  {
        const ilk = $('input[name="ilk"]:checked').value
        const sign = ($('input[name="sign"]:checked').value == "repay") ? "-" : ""
        const dink = parseUnits(sign + $('#dink').value, 18);
        const dart = parseUnits(sign + $('#dart').value, 18)
        if (dink > usrGemAllowance) {
            const { request } = await publicClient.simulateContract({
              abi: gemAbi,
              address: gems[ilk],
              functionName: 'approve',
              args: [MAXUINT],
              account: account,
            })
            await walletClient.writeContract(request)
        }
        const urn = account
        const dinkB32 = pad(toHex(dink))
        await bank.frob(stringToHex(ilk, {size: 32}), urn, dinkB32, dart, {gasLimit:10000000})
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
