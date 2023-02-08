import * as React from "react";
import { SContainer } from "../components/shared";
import Button from "../components/Button";
import Select from "react-select";
import { SModalContainer, SModalTitle } from "./shared";
import { collectionOptions, CollectionOptions } from "./collectionOptions";

import styled from "styled-components";

const SInput = styled.input`
  width: 100%;
  padding: 12px 20px;
  margin: 8px 0;
  display: block;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
`;

const SMessage = styled.textarea`
  width: 100%;
  padding: 12px 20px;
  margin: 8px 0;
  display: block;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
`;

const SSelect = styled.select`
  width: 100%;
  padding: 12px 20px;
  margin: 8px 0;
  display: block;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
`;

export const SLabel = styled.label`
  display: block;
`;

interface SignDIDMessageProps {
  errorMessage?: string;
  savedDid?: string;
  onSign: (did: string, info: any) => any;
}

const SignDIDReputationMessagePrompt = (props: SignDIDMessageProps) => {
  const [did, setDid] = React.useState(props.savedDid || "");
  const [info, setInfo] = React.useState<any>({});
  const [messageType, setMessageType] = React.useState("nft_collection_like");

  const getForm = () => {
    switch (messageType) {
      case "did_trust":
        return (
          <div>
            <SLabel htmlFor="did">DID you trust</SLabel>
            <SInput
              type="text"
              name="did"
              placeholder="did:chia:..."
              onChange={(e) => {
                setInfo({
                  type: "did_trust",
                  ts: new Date().toISOString(),
                  data: { did: e.currentTarget.value },
                });
              }}
            />
          </div>
        );
      case "nft_collection_like":
        return (
          <>
            <div>
              <SLabel htmlFor="did">Collection ID You Like</SLabel>
              <Select
                classNamePrefix="select"
                options={collectionOptions}
                onChange={(e: unknown, m) => {
                  const selectedOption = e as CollectionOptions;
                  if (selectedOption.value !== "other") {
                    setInfo({
                      type: "nft_collection_like",
                      ts: new Date().toISOString(),
                      data: { collection_id: selectedOption.value },
                    });
                  } else {
                    setInfo({
                      type: "nft_collection_like",
                      ts: new Date().toISOString(),
                      data: { collection_id: "" },
                    });
                  }
                }}
              ></Select>
              <SInput
                type="text"
                name="nft"
                placeholder="col1..."
                value={info?.data?.collection_id}
                onChange={(e) => {
                  setInfo({
                    type: "nft_collection_like",
                    ts: new Date().toISOString(),
                    data: { collection_id: e.currentTarget.value },
                  });
                }}
              />
              {collectionOptions.find(
                (o) => o.value === info?.data?.collection_id
              ) ? (
                <>
                  <div>
                    <img
                      alt={
                        collectionOptions.find(
                          (o) => o.value === info?.data?.collection_id
                        )?.label
                      }
                      style={{
                        height: "3.2rem",
                        width: "3.2rem",
                        borderRadius: "0.25rem",
                      }}
                      src={`https://nft.dexie.space/preview/tiny/${info?.data?.collection_id}.webp`}
                    />
                  </div>
                </>
              ) : (
                <></>
              )}
            </div>
          </>
        );
      default:
        return <div>Select an option to continue</div>;
    }
  };

  const signPressed = () => {
    // TODO: Validate info
    props.onSign(did, info);
  };

  return (
    <>
      <SModalContainer>
        <SModalTitle>{"Sign DID Message"}</SModalTitle>
        <SContainer>
          <form>
            <div>
              <SLabel htmlFor="did">Your DID</SLabel>
              <SInput
                type="text"
                name="did"
                defaultValue={did}
                placeholder="did:chia:..."
                onChange={(e) => {
                  setDid(e.currentTarget.value);
                }}
              />
            </div>
            <div>
              <SLabel htmlFor="message_type">Message Type</SLabel>
              <SSelect
                name="message_type"
                onChange={(e) => setMessageType(e.currentTarget.value)}
                defaultValue="nft_collection_like"
              >
                <option value="did_trust">Trust DID</option>
                <option value="nft_collection_like">
                  Like NFT Collection{" "}
                </option>
              </SSelect>
            </div>
            <div>{getForm()}</div>
            <Button type="button" onClick={signPressed}>
              Sign
            </Button>
          </form>
          {props.errorMessage ? <div>{props.errorMessage}</div> : <></>}
        </SContainer>
      </SModalContainer>
    </>
  );
};

export default SignDIDReputationMessagePrompt;
