import * as React from "react";
import styled from "styled-components";

const SBannerWrapper = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`;

const SBanner = styled.div`
  width: 275px;
  height: 45px;
  background: url(/assets/walletconnect.png) no-repeat;
  background-size: cover;
  background-position: center;
`;

const Banner = () => (
  <>
    <div>
      <h4>Chia DID Reputation System Demo</h4>
    </div>
  <SBannerWrapper>
    <SBanner />
  </SBannerWrapper>

  </>
);

export default Banner;
