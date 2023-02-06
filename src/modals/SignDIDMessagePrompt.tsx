import * as React from "react";
import { SButtonContainer } from "../components/app";

import { SContainer } from "../components/shared";
import Button from "../components/Button";

import { SModalContainer, SModalTitle } from "./shared";

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

export const SLabel = styled.label`
  display: block;
`;

interface SignDIDMessageProps {
  savedDid?: string;
  onSign: (did: string, message: string) => any;
}

const SignDIDMessagePrompt = (props: SignDIDMessageProps) => {
  const [did, setDid] = React.useState(props.savedDid || "");
  const [message, setMessage] = React.useState("");

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
              <SLabel htmlFor="message">Message</SLabel>
              <SMessage
                name="message"
                onChange={(e) => setMessage(e.currentTarget.value)}
              />
            </div>
            <Button type="button" onClick={() => props.onSign(did, message)}>
              Sign
            </Button>
          </form>
        </SContainer>
      </SModalContainer>
    </>
  );
};

export default SignDIDMessagePrompt;
