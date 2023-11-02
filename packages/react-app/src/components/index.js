import styled from "styled-components";
import { createGlobalStyle } from "styled-components";

export const Body = styled.div`
  align-items: center;
  color: seashell;
  display: flex;
  flex-direction: column;
  font-size: calc(10px + 2vmin);
  justify-content: center;
`;

export const Button = styled.button`
  background-color: red;
  border: none;
  border-radius: 8px;
  color: #282c34;
  cursor: pointer;
  font-size: 16px;
  margin: 0px 20px;
  padding: 12px 24px;
  text-align: center;
  text-decoration: none;
`;

export const BankCallBody = styled(Body)`
  flex-direction: row;
  height: 40%;
`;


export const CenterButton = styled.button`
  border: none;
  border-radius: 8px;
  color: #282c34;
  cursor: pointer;
  font-size: 16px;
  margin: 0px 20px;
  padding: 12px 24px;
  text-align: center;
  text-decoration: none;
  justify-content: center;
`;


export const FancyButton = styled.button`
  background-color: cyan;
  border: none;
  color: white;
  text-align: center;
  font-weight: bold;
  text-decoration: none;
  display: inline-block;
  font-size: 30px;
  margin: 4px 2px;
  transition-duration: 0.4s;
  cursor: pointer;
  border-radius: 18px;
  width: 125px;
  height: 60px;

  &:hover {
    color: #4CAF50;
  }
`;

export const BButton = styled(FancyButton)`
  background-color: #7DF9FF;
`;

export const FButton = styled(FancyButton)`
  background-color: coral;
`;

export const DButton = styled(FancyButton)`
  background-color: purple;
`;

export const KButton = styled(FancyButton)`
  background-color: yellow;
  color: black;
`;



export const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(20vh);
  width: calc(100vw);
`;


export const FormContainer = styled(Container)`
  height: calc(40vh);
`;

export const RowContainer = styled.div`
  display: flex;
  justify-content: center;
  height: calc(8vh);
`;

export const TopRightContainer = styled(RowContainer)`
  justify-content: flex-end;
  width: 50%;
`;
export const TopLeftContainer = styled(TopRightContainer)`
  justify-content: flex-start;
`;



export const InputBox = styled.input`
  padding: 10px;
  font-size: 20px;
  border: 2px solid #ccc;
  border-radius: 5px;
  margin-bottom: 10px;
  width: calc(20vw);
  height: 100%;
  box-sizing: border-box;
  border-radius: 20px;
  overflow-wrap: break-word;
  word-wrap: break-word;
  &:focus {
    border-color: #007bff;
    outline: none;
  }
`;




export const Header = styled.header`
  align-items: center;
  color: black;
  font-size: 50px;
  font-weight: bold;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
`;

export const WalletHeader = styled(Header)`
  min-height: calc(6vh);
`;

export const TitleHeader = styled(Header)`
  height: calc(30vh);
  font-size: 60px;
`;


export const Image = styled.img`
  height: 90%;
  margin: 10px;
  pointer-events: none;
`;

export const Link = styled.a.attrs({
  target: "_blank",
  rel: "noopener noreferrer",
})`
  color: #61dafb;
  margin-top: 8px;
`;

export const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    background-image: url('/home/kevin/sarah/my-eth-app/packages/react-app/src/components/clouds.jpg'); /* Replace 'path/to/your/sky-image.jpg' with the actual path to your sky image file */
    background-size: cover;
    background-repeat: no-repeat;
    background-attachment: fixed;
  }
`;
