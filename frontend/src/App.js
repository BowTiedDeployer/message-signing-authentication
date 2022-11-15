import * as React from 'react'
import logo from './logo.svg';
import './App.css';
import SignIn from "./components/SignIn";
import {AppContext} from "./AppContext";
import axios from "axios";
import {useEffect, useState} from "react";

const apiUrl = 'http://localhost:3000';

// axios.interceptors.request.use(
//     config => {
//         const token = localStorage.getItem('token');
//         console.log("We have a token", token);
//         if (token) {
//             config.headers.authorization = `Bearer ${token}`;
//         }
//         return config;
//     },
//     error => {
//         return Promise.reject(error);
//     }
// );
//

function App() {
    const storedUserDetails = localStorage.getItem('userDetails');
    const [userDetails, setUserDetails] = useState(storedUserDetails || null);

    useEffect(() => {
        axios.interceptors.response.use(
            response => {
                console.log("RESP", response);
                return response;
            },
            error => {
                console.log("ERROR", error)
                if (error.response.status === 401) {
                    // Unauthorised
                    localStorage.setItem('userDetails', null);
                    setUserDetails(null);
                }
                return Promise.reject(error);
            }
        );

        console.log("On init");
        const refreshToken = async () => {
            try {
                const {data} = await axios.post('/refresh');
                console.log("Refresh", data)
            } catch (error) {
                if (error.response.status === 401) {
                    // Unauthorised
                    localStorage.setItem('userDetails', null);
                    setUserDetails(null);
                }
            }
        }

        refreshToken();
    }, [])


    return (
        <AppContext.Provider value={[userDetails, setUserDetails]}>
            <div className="App">
                <header className="App-header">
                    <img src={logo} className="App-logo" alt="logo"/>
                    <SignIn></SignIn>
                </header>
            </div>
        </AppContext.Provider>
    );
}

export default App;
