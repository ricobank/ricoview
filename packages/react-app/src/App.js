import { useQuery } from "@apollo/client";
import { Contract } from "@ethersproject/contracts";
import { shortenAddress, useCall, useSendTransaction, useEthers, useLookupAddress } from "@usedapp/core";
import React, { useEffect, useState } from "react";
import { BrowserRouter, useNavigate } from 'react-router-dom';

import { InputBox, Body, CenterButton, FancyButton, Button, Container, RowContainer, TopRightContainer, TopLeftContainer, Header, Image, Link } from "./components";
import { DButton, KButton, FButton, BButton, TitleHeader, WalletHeader, BankCallBody } from "./components";
import { FormContainer} from "./components";
import logo from "./ethereumLogo.png";

import { addresses, abis } from "@my-app/contracts";
import GET_TRANSFERS from "./graphql/subgraph";
import { N as bn, wad, ray } from 'minihat';
import * as ethers from 'ethers';
import { Buffer } from 'buffer';

export function b32 (arg: any): Uint8Array {
  if (arg._isBigNumber) {
    const hex = arg.toHexString()
    const buff = Buffer.from(hex.slice(2), 'hex')
    const b32 = ethers.utils.zeroPad(buff, 32) 
    return b32 
  } else if (typeof (arg) === 'string') {
    const b32 = Buffer.from(arg + '\0'.repeat(32 - arg.length))
    return b32 
  } else {
    throw new Error(`b32 takes a BigNumber or string, got ${arg}, a ${typeof (arg)}`)
  }
}

function WalletButton() {
  const [rendered, setRendered] = useState("");

  const { ens } = useLookupAddress();
  const { account, activateBrowserWallet, deactivate, error } = useEthers();

  useEffect(() => {
    if (ens) {
      setRendered(ens);
    } else if (account) {
      setRendered(shortenAddress(account));
    } else {
      setRendered("");
    }
  }, [account, ens, setRendered]);

  useEffect(() => {
    if (error) {
      console.error("Error while connecting wallet:", error.message);
    }
  }, [error]);

  return (
    <Button
      onClick={() => {
        if (!account) {
          activateBrowserWallet();
        } else {
          deactivate();
        }
      }}
    >
      {rendered === "" && "Connect Wallet"}
      {rendered !== "" && rendered}
    </Button>
  );
}

function AnalyticsButton() {
  return (
    <Button onClick={() => {
      window.open('https://bank.dev/rico', '_blank').focus()
    }}>
      Analytics
    </Button>
  );
}

function FrobForm() {
  const [dink, setDink] = useState("");
  const [dart, setDart] = useState("");
  const [i, setI] = useState("");
  const [u, setU] = useState("");

  const { sendTransaction, state } = useSendTransaction()

  const handleFrob = () => {
      const iface = new ethers.utils.Interface(abis.bank)
      const dinkPacked = ethers.utils.solidityPack(['int'], [wad(dink)])
      const data = iface.encodeFunctionData(
          'frob', [b32(i), u, dinkPacked, wad(dart)]
      )
      sendTransaction({to: addresses.bank, data})
  }

  const handleBail = () => {
    const iface = new ethers.utils.Interface(abis.bank)
    const data = iface.encodeFunctionData('bail', [b32(i), u])
    sendTransaction({to: addresses.bank, data})
  }

  const handleDrip = () => {
    const iface = new ethers.utils.Interface(abis.bank)
    console.log("I ", i, "b32(i)", b32(i))
    const data = iface.encodeFunctionData('drip', [b32(i)])
    sendTransaction({to: addresses.bank, data})
  }

  const handleKeep = () => {
    const iface = new ethers.utils.Interface(abis.bank)
    const data = iface.encodeFunctionData('keep', [[]])
    console.log("KEEP DATA", data)
    sendTransaction({to: addresses.bank, data})
  }
 
 
  return (
    <FormContainer>
      <RowContainer>
        <InputBox value={i}
          onChange={(e) => setI(e.target.value)} placeholder="ilk" />
        <InputBox value={u}
          onChange={(e) => setU(e.target.value)} placeholder="usr" />
        <InputBox value={dink}
          onChange={(e) => setDink(e.target.value)} placeholder="dink" />
        <InputBox value={dart}
          onChange={(e) => setDart(e.target.value)} placeholder="dart" />
      </RowContainer>
      <BankCallBody>
        <FButton onClick={handleFrob}>frob</FButton>
        <BButton onClick={handleBail}>bail</BButton>
        <DButton onClick={handleDrip}>drip</DButton>
        <KButton onClick={handleKeep}>keep</KButton>
      </BankCallBody>
    </FormContainer>
  );
}

/*
function BailForm() {
  const [i, setI] = useState("");
  const [u, setU] = useState("");

  const { error: contractCallError, value: tokenBalance } =
    useCall({
       contract: new Contract(addresses.bank, abis.bank),
       method: "frob",
       args: [
         "0x3f8CB69d9c0ED01923F11c829BaE4D9a4CB6c82C"],
    }) ?? {};



  const submitStyle = {
    'display': 'flex',
    'justify-content': 'center',
    'align-items': 'center'
  };

  return (
    <FormContainer>
      <RowContainer>
        <InputBox value={i}
          onChange={(e) => setI(e.target.value)} placeholder="ilk" />
        <InputBox value={u}
          onChange={(e) => setU(e.target.value)} placeholder="usr" />
      </RowContainer>
      <BankCallBody>
        <BButton
          onClick={() => {
            const bank = new Contract(addresses.bank, abis.bank)
            return bank.bail(b32(i), u)
          }}
        >
        bail 
        </BButton>
      </BankCallBody>

    </FormContainer>
  );
}
*/



function App() {
  // Read more about useDapp on https://usedapp.io/
  const { error: contractCallError, value: tokenBalance } =
    useCall({
       contract: new Contract(addresses.ceaErc20, abis.erc20),
       method: "balanceOf",
       args: ["0x3f8CB69d9c0ED01923F11c829BaE4D9a4CB6c82C"],
    }) ?? {};

  const { loading, error: subgraphQueryError, data } = useQuery(GET_TRANSFERS);

  useEffect(() => {
    if (subgraphQueryError) {
      console.error("Error while querying subgraph:", subgraphQueryError.message);
      return;
    }
    if (!loading && data && data.transfers) {
      console.log({ transfers: data.transfers });
    }
  }, [loading, subgraphQueryError, data]);

  return (
    <Container>
      <RowContainer>
        <TopLeftContainer><Image src='favicon.ico' /></TopLeftContainer>
        <TopRightContainer>
          <WalletHeader>
            <BrowserRouter><AnalyticsButton /></BrowserRouter>
            <WalletButton />
          </WalletHeader>
        </TopRightContainer>
      </RowContainer>
      <Body>
        <TitleHeader>Rico Credit System</TitleHeader>
        <FrobForm />
      </Body>
    </Container>
  );
}

/*
        <Image src={logo} alt="ethereum-logo" />
        <p>
          Edit <code>packages/react-app/src/App.js</code> and save to reload.
        </p>
        <Link href="https://reactjs.org">
          Learn React
        </Link>
        <Link href="https://usedapp.io/">Learn useDapp</Link>
        <Link href="https://thegraph.com/docs/quick-start">Learn The Graph</Link>
*/
 

export default App;
