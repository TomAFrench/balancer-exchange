//@ts-ignore
import React from 'react';
import { appConfig } from 'configs';
import styled from 'styled-components';

const HeaderFrame = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
`;

const HeaderElement = styled.div`
    margin: 1.25rem;
    display: flex;
    min-width: 0;
    display: flex;
    align-items: center;
`;

const Title = styled.div`
    display: flex;
    align-items: center;
    cursor: default;
    img {
        height: 32px;
        width: 32px;
    }
`;

const AppName = styled.div`
    font-family: Roboto;
    font-style: normal;
    font-weight: 500;
    font-size: 15px;
    line-height: 18px;
    letter-spacing: 1px;
    color: var(--header-text);
    margin-left: 12px;
`;

// const Link = styled.a`
//     font-family: Roboto;
//     margin-right: 24px;
//     font-size: 15px;
//     display: flex;
//     align-items: center;
//     color: var(--header-text);
//     text-decoration: none;
//     @media screen and (max-width: 767px) {
//         display: none;
//     }
// `;

const Header = () => {
    return (
        <HeaderFrame>
            <HeaderElement>
                <Title>
                    <img src="pebbles-pad.svg" alt="pebbles" />
                    <AppName>{appConfig.name}</AppName>
                </Title>
            </HeaderElement>
        </HeaderFrame>
    );
};

export default Header;
