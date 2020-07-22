import React from "react";
import styled, { css } from "styled-components";

const OuterWrapper = styled.div`
    display: flex;
    flex-flow: column nowrap;
    padding: 16px 32px 32px;
`;

const StyledLogo = styled.img`
    margin: -14px 0px 20px -8px;
`;

const textStyles = css`
    color: rgba(0, 0, 0, 0.87);
`;

const Text = styled.span`
    ${textStyles};
    font-size: 14px;
`;

const ListWrapper = styled.div`
    display: flex;
    flex-flow: column nowrap;
    margin: 16px 0px 0px 4px;
`;

const ListItem = styled.span`
    ${textStyles};
    font-size: 12px;
    line-height: 14px;
    margin-top: 4px;
`;

const BottomWrapper = styled.div`
    margin-top: 16px;
`;

const GnosisLink = styled.a.attrs({
    target: "_blank",
    rel: "noopener noreferrer"
})`
    color: var(--link-text);
`

const BalancerExplainer = () => (
  <OuterWrapper>
      <StyledLogo alt="Balancer Logo" src={'TitleLogo.png'} width={200} />
      <Text>
        Balancer is an decentralised exchange allowing you to quickly trade between different tokens while maintaining control over your funds.
        All trades are automatically routed across a number of Balancer's pools of tokens to ensure that you receive the best possible rate.
      </Text>
      <ListWrapper>
          <ListItem>1. Select the two tokens you would like to trade.</ListItem>
          <ListItem>2. Enter the amount of tokens you wish to buy/sell.</ListItem>
          <ListItem>3. Check the expected exchange rate of the trade. </ListItem>
          <ListItem>4. If you are happy to proceed then press the swap button. </ListItem>
      </ListWrapper>
      <BottomWrapper>
          <Text>For more information please visit the <GnosisLink href="https://balancer.finance">Balancer website </GnosisLink></Text>
      </BottomWrapper>
  </OuterWrapper>
);

export default BalancerExplainer;