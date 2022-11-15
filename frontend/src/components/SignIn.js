import axios from "axios";
import {useContext, useState} from "react";
import {AppContext} from "../AppContext";
import {AppConfig, openSignatureRequestPopup, UserSession} from "@stacks/connect";
import {StacksTestnet} from "@stacks/network";
import {getAddressFromPublicKey, TransactionVersion} from '@stacks/transactions';
import { v4 as uuidv4 } from 'uuid';


const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({appConfig});

const WelcomeUser = ({isUserWelcomed, wallet}) => {
    if (isUserWelcomed === null) {
        return;
    }

    if (isUserWelcomed === false) {
        return <div>Not welcomed yet!</div>
    }

    return <div>Welcome user {wallet}</div>;
}

function SignIn() {
    const [userDetails, setUserDetails] = useContext(AppContext);
    const [isUserWelcomed, setIsUserWelcomed] = useState(null);
    const [wallet, setWallet] = useState(userDetails || null);

    const authenticate = async () => {
        const token = uuidv4();
        openSignatureRequestPopup({
            message: token,
            network: new StacksTestnet(), // for mainnet, `new StacksMainnet()`
            appDetails: {
                name: "My Message Signing App",
                icon: window.location.origin + "/my-app-logo.svg",
            },
            onFinish: async (data) => {
                console.log("Signature of the message", data.signature);
                console.log("Use public key:", data.publicKey);
                console.log("To send", data);
                // console.log("Addr", publicKeyToBtcAddress(data.publicKey), publicKeyToAddress(AddressVersion.TestnetMultiSig, data.publicKey));
                console.log("Addr2", getAddressFromPublicKey(data.publicKey, TransactionVersion.Testnet))
                try {
                    await axios.post('/signin', {token, publicKey: data.publicKey, signature: data.signature})

                    const updatedWallet = getAddressFromPublicKey(data.publicKey, TransactionVersion.Testnet);
                    setWallet(updatedWallet);

                    localStorage.setItem('userDetails', updatedWallet);
                    setUserDetails(updatedWallet);
                    setIsUserWelcomed(true);
                } catch (e) {
                    console.error("Failed to login", e);
                }
            },
        });
    }
    const welcome = async () => {
        try {
            const {data} = await axios.get('/welcome');
            console.log("WELCOME", data);
            setIsUserWelcomed(true);
        } catch (e) {
            setIsUserWelcomed(false);
        }
    }

    const logout = async () => {
        const {data} = await axios.get('/logout');
        localStorage.setItem('userDetails', null);
        setUserDetails(null);
        console.log("LOGOUT", data);
    }

    if (userDetails) {
        return <div>
            Welcome {userDetails.wallet}
            <br/>
            <button onClick={welcome}>Welcome request</button>
            <br/>
            <button onClick={logout}>Logout</button>
            <br/>
            <WelcomeUser isUserWelcomed={isUserWelcomed} wallet={wallet}></WelcomeUser>
        </div>;
    }


    return <div>
        Username <input></input>
        <br/>
        Password <input></input>
        <br/>
        <button onClick={authenticate}>Sign in</button>
        <br/>
        <button onClick={welcome}>Welcome request</button>
        <WelcomeUser isUserWelcomed={isUserWelcomed} wallet={wallet}></WelcomeUser>
    </div>
}

export default SignIn;
