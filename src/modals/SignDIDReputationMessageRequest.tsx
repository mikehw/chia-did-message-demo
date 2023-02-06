import * as React from "react";

import Loader from "../components/Loader";
import { SContainer, STable, SRow, SKey, SValue } from "../components/shared";

import { SModalContainer, SModalTitle, SModalParagraph } from "./shared";

interface RequestModalProps {
  pending: boolean;
  result: any;
  currentDID: string;
  currentMessage: string;
}

const SignDIDReputationMessageRequest = (props: RequestModalProps) => {
  const { pending, result } = props;
  console.log("result", result);
  const resultData =
    result?.["result"]?.toString() && JSON.parse(result["result"]?.toString());
  return (
    <>
      {pending ? (
        <SModalContainer>
          <SModalTitle>{"Pending Sign Message Request in Wallet"}</SModalTitle>
          <SContainer>
            <Loader />
            <SModalParagraph>
              {"Approve or reject request using your wallet"}
            </SModalParagraph>
          </SContainer>
        </SModalContainer>
      ) : result ? (
        <SModalContainer>
          <SModalTitle>
            {resultData && resultData?.data?.success
              ? "Message Sent!"
              : "Request Failed"}
          </SModalTitle>
          <STable>
            {resultData && resultData?.data?.success ? (
              <></>
            ) : (
              <>
                {Object.keys(result).map((key) => (
                  <SRow key={key}>
                    <SKey>{key}</SKey>
                    <SValue>{result[key].toString()}</SValue>
                  </SRow>
                ))}
              </>
            )}
          </STable>
        </SModalContainer>
      ) : (
        <SModalContainer>
          <SModalTitle>{"JSON-RPC Request Rejected"}</SModalTitle>
        </SModalContainer>
      )}
    </>
  );
};

export default SignDIDReputationMessageRequest;
