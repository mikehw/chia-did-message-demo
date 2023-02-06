import type { NextPage } from "next";
import React, { useEffect, useState } from "react";

import Banner from "../components/Banner";
import Blockchain from "../components/Blockchain";
import Column from "../components/Column";
import Dropdown from "../components/Dropdown";
import Header from "../components/Header";
import Modal from "../components/Modal";
import { DEFAULT_MAIN_CHAINS, DEFAULT_TEST_CHAINS } from "../constants";
import {
  AccountAction,
  getLocalStorageDID,
  setLocaleStorageDID,
  setLocaleStorageTestnetFlag,
} from "../helpers";
import Toggle from "../components/Toggle";
import RequestModal from "../modals/RequestModal";
import PairingModal from "../modals/PairingModal";
import PingModal from "../modals/PingModal";
import {
  SAccounts,
  SAccountsContainer,
  SButtonContainer,
  SConnectButton,
  SContent,
  SLanding,
  SLayout,
  SToggleContainer,
} from "../components/app";
import { useWalletConnectClient } from "../contexts/ClientContext";
import { useJsonRpc } from "../contexts/JsonRpcContext";
import { useChainData } from "../contexts/ChainDataContext";
import SignDIDMessagePrompt from "../modals/SignDIDMessagePrompt";
import SignDIDMessageRequest from "../modals/SignDIDMessageRequest";
import SignDIDReputationMessagePrompt from "../modals/SignDIDReputationMessagePrompt";
import SignDIDReputationMessageRequest from "../modals/SignDIDReputationMessageRequest";
import { reputation_schema, useRelay } from "../helpers/useRelay";
import {
  generatePrivateKey,
  getPublicKey,
  getEventHash,
  signEvent,
} from "nostr-tools";

// Normal import does not work here
const { version } = require("@walletconnect/sign-client/package.json");

const sk = generatePrivateKey();
const pk = getPublicKey(sk);

const Home: NextPage = () => {
  const [modal, setModal] = useState("");
  const [currentChainId, setCurrentChainId] = useState("");
  const [currentAddress, setCurrentAddress] = useState("");
  const [currentMessage, setCurrentMessage] = useState("");
  const [waitingFor, setWaitingFor] = useState("");
  const [currentDID, setCurrentDID] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { isConnected, subscribeToEvents, publish, relay } = useRelay();
  const [events, setEvents] = useState<any[]>([]);

  const closeModal = () => setModal("");
  const openPairingModal = () => setModal("pairing");
  const openPingModal = () => setModal("ping");
  const openDIDMessagePromptModal = () => setModal("sign-did-message-prompt");
  const openDIDMessageRequestModal = () => setModal("sign-did-message-request");
  const openDIDReputationMessagePromptModal = () =>
    setModal("sign-did-reputation-message-prompt");
  const openDIDReputationMessageRequestModal = () =>
    setModal("sign-did-reputation-message-request");

  useEffect(() => {
    relay?.connect().then(() => {
      subscribeToEvents(
        {
          kinds: [8444],
        },
        async (event: any) => setEvents(e => [event, ...e])
      );
    });
  }, []);

  // Initialize the WalletConnect client.
  const {
    client,
    pairings,
    session,
    connect,
    disconnect,
    chains,
    relayerRegion,
    accounts,
    balances,
    isFetchingBalances,
    isInitializing,
    setChains,
    setRelayerRegion,
  } = useWalletConnectClient();

  // Use `JsonRpcContext` to provide us with relevant RPC methods and states.
  const {
    ping,
    chiaRpc,
    isRpcRequestPending,
    rpcResult,
    isTestnet,
    setIsTestnet,
  } = useJsonRpc();

  const { chainData } = useChainData();

  // Close the pairing modal after a session is established.
  useEffect(() => {
    if (session && modal === "pairing") {
      closeModal();
    }
  }, [session, modal]);

  const onConnect = () => {
    if (typeof client === "undefined") {
      throw new Error("WalletConnect is not initialized");
    }
    // Suggest existing pairings (if any).
    if (pairings.length) {
      openPairingModal();
    } else {
      // If no existing pairings are available, trigger `WalletConnectClient.connect`.
      connect();
    }
  };

  const onPing = async () => {
    openPingModal();
    await ping();
  };

  const getChiaActions = (): AccountAction[] => {
    const SignMessageWithDID = async (chainId: string, address: string) => {
      setCurrentAddress(address);
      setCurrentChainId(chainId);
      openDIDMessagePromptModal();
    };

    const SignReputationMessageWithDID = async (
      chainId: string,
      address: string
    ) => {
      setCurrentAddress(address);
      setCurrentChainId(chainId);
      openDIDReputationMessagePromptModal();
    };

    return [
      {
        method: "Sign Message With DID",
        callback: SignMessageWithDID,
      },
      {
        method: "Sign and Send Reputation Message With DID",
        callback: SignReputationMessageWithDID,
      },
    ];
  };

  const getBlockchainActions = (chainId: string) => {
    const [namespace] = chainId.split(":");
    switch (namespace) {
      case "chia":
        return getChiaActions();
      default:
        break;
    }
  };

  // Toggle between displaying testnet or mainnet chains as selection options.
  const toggleTestnets = () => {
    const nextIsTestnetState = !isTestnet;
    setIsTestnet(nextIsTestnetState);
    setLocaleStorageTestnetFlag(nextIsTestnetState);
  };

  const handleChainSelectionClick = (chainId: string) => {
    if (chains.includes(chainId)) {
      setChains(chains.filter((chain) => chain !== chainId));
    } else {
      setChains([...chains, chainId]);
    }
  };

  const signDidMessage = async (didId: string, message: string) => {
    setCurrentDID(didId);
    setLocaleStorageDID(didId);
    setCurrentMessage(message);
    openDIDMessageRequestModal();
    await chiaRpc.signMessageById(currentChainId, currentAddress, {
      did: didId,
      message: message,
    });
  };

  const signDidReputationMessage = async (didId: string, info: any) => {
    setCurrentDID(didId);
    setLocaleStorageDID(didId);
    if (!reputation_schema.safeParse(info).success) {
      setErrorMessage("Invalid reputation message");
      return;
    }
    const message = JSON.stringify(info);
    setCurrentMessage(message);
    openDIDReputationMessageRequestModal();
    await chiaRpc.signMessageById(currentChainId, currentAddress, {
      did: didId,
      message: message,
    });
    if (rpcResult) {
      sendMessage(rpcResult, currentDID, currentMessage);
    } else {
      setWaitingFor("reputation");
    }
  };

  const sendMessage = async (
    rpcResult: any,
    currentDID: string,
    currentMessage: string
  ) => {
    if (rpcResult?.valid) {
      const chiaResponse = JSON.parse(rpcResult?.result);
      if (chiaResponse.data.success) {
        const messageToPublish = JSON.stringify({
          did: currentDID,
          msg: currentMessage,
          sig: chiaResponse.data.signature,
        });
        console.log(messageToPublish);
        const event: any = {
          kind: 8444,
          pubkey: pk,
          created_at: Math.floor(Date.now() / 1000),
          tags: [["#t", isTestnet ? "testnet-did-message": "did-message"]],
          content: messageToPublish,
        };
        event.id = await getEventHash(event);
        event.sig = await signEvent(event, sk);
        await publish(event);
      } else {
        console.log("not successful");
        console.log(chiaResponse);
      }
    } else {
      console.log("Invalid");
      console.log(rpcResult);
    }
  };

  useEffect(() => {
    if (isRpcRequestPending != true && waitingFor === "reputation") {
      sendMessage(rpcResult, currentDID, currentMessage);
      setWaitingFor("");
    }
  }, [isRpcRequestPending, waitingFor]);

  // Renders the appropriate model for the given request that is currently in-flight.
  const renderModal = () => {
    switch (modal) {
      case "pairing":
        if (typeof client === "undefined") {
          throw new Error("WalletConnect is not initialized");
        }
        return <PairingModal pairings={pairings} connect={connect} />;
      case "request":
        return (
          <RequestModal pending={isRpcRequestPending} result={rpcResult} />
        );
      case "ping":
        return <PingModal pending={isRpcRequestPending} result={rpcResult} />;
      case "sign-did-message-prompt":
        return (
          <SignDIDMessagePrompt
            onSign={signDidMessage}
            savedDid={getLocalStorageDID()}
          />
        );
      case "sign-did-message-request":
        return (
          <SignDIDMessageRequest
            pending={isRpcRequestPending}
            result={rpcResult}
            currentDID={currentDID}
            currentMessage={currentMessage}
          />
        );
      case "sign-did-reputation-message-prompt":
        return (
          <SignDIDReputationMessagePrompt
            onSign={signDidReputationMessage}
            savedDid={getLocalStorageDID()}
            errorMessage={errorMessage}
          />
        );
      case "sign-did-reputation-message-request":
        return (
          <SignDIDReputationMessageRequest
            pending={isRpcRequestPending}
            result={rpcResult}
            currentDID={currentDID}
            currentMessage={currentMessage}
          />
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    const chainOptions = isTestnet ? DEFAULT_TEST_CHAINS : DEFAULT_MAIN_CHAINS;
    return !accounts.length && !Object.keys(balances).length ? (
      <SLanding center>
        <Banner />
        <h6>{`Using v${version || "2.0.0-beta"}`}</h6>
        <SButtonContainer>
          <h6>Select chains:</h6>
          <SToggleContainer>
            <p>Testnets Only?</p>
            <Toggle active={isTestnet} onClick={toggleTestnets} />
          </SToggleContainer>
          {chainOptions.map((chainId) => (
            <Blockchain
              key={chainId}
              chainId={chainId}
              chainData={chainData}
              onClick={handleChainSelectionClick}
              active={chains.includes(chainId)}
            />
          ))}
          <SConnectButton left onClick={onConnect} disabled={!chains.length}>
            {"Connect"}
          </SConnectButton>
          <Dropdown
            relayerRegion={relayerRegion}
            setRelayerRegion={setRelayerRegion}
          />
        </SButtonContainer>
      </SLanding>
    ) : (
      <SAccountsContainer>
        <h3>Accounts</h3>
        <SAccounts>
          {accounts.map((account) => {
            const [namespace, reference, address] = account.split(":");
            const chainId = `${namespace}:${reference}`;
            return (
              <Blockchain
                key={account}
                active={true}
                chainData={chainData}
                fetching={isFetchingBalances}
                address={address}
                chainId={chainId}
                balances={balances}
                actions={getBlockchainActions(chainId)}
              />
            );
          })}
        </SAccounts>
      </SAccountsContainer>
    );
  };

  return (
    <SLayout>
      <Column maxWidth={1000} spanHeight>
        <Header ping={onPing} disconnect={disconnect} session={session} />
        <SContent>{isInitializing ? "Loading..." : renderContent()}</SContent>
        <div>
          <h6>Chia Mainnet Reputation Messages</h6>
          <div>
            {isConnected ? (
              <div> Socket connected </div>
            ) : (
              <div> Socket disconnected </div>
            )}
          </div>
          <table style={{ alignContent: "left" }}>
            <thead>
              <tr>
                <td>
                  <b>Source DID</b>
                </td>
                <td>
                  <b>Message Type</b>
                </td>
                <td>
                  <b>Target</b>
                </td>
                <td>
                  <b>Timestamp</b>
                </td>
                <td>
                  <b>Verified by Mike</b>
                </td>
              </tr>
            </thead>
            {events.map((event: any) => {
              const sourceDid = JSON.parse(event.content)?.did;
              const messageType = event.body.type;
              const targetDid = event.body?.data?.did;
              const ts = JSON.parse(JSON.parse(event.content)?.msg)?.ts;
              const verified = event.body.valid;
              const rowStyle = {
                fontSize: "11px",
                fontFamily: `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`,
              };
              return (
                <tr key={event.id}>
                  <td style={rowStyle}>{trimDid(sourceDid)}</td>
                  <td>{messageType}</td>
                  <td style={rowStyle}>{trimDid(targetDid)}</td>
                  <td>{new Date(ts).toLocaleString()}</td>
                  <td>{JSON.stringify(verified ?? false)}</td>
                </tr>
              );
            })}
          </table>
        </div>
      </Column>
      <Modal show={!!modal} closeModal={closeModal}>
        {renderModal()}
      </Modal>
    </SLayout>
  );
};

function trimDid(did: string) {
  return did.substring(0, 10) + "..." + did.substring(did.length - 10);
}

export default Home;
