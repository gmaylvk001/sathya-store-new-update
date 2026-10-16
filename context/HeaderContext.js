// context/HeaderContext.js
"use client";
import { createContext, useContext, useState, useEffect } from 'react';

const HeaderContext = createContext();

export const HeaderProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeOfferTimer, setActiveOfferTimer] = useState(null);
  const [activeTopBanner, setActiveTopBanner] = useState(null);
  const [normalTopBanner, setNormalTopBanner] = useState(null);

  const updateHeaderdetails = (user) => {
    setUserData(user.user);
    setIsLoggedIn(!!user.user);
  };

  return (
    <HeaderContext.Provider
      value={{
        userData,
        setUserData,
        isLoggedIn,
        setIsLoggedIn,
        isAdmin,
        setIsAdmin,
        activeOfferTimer,
        setActiveOfferTimer,
        activeTopBanner,
        setActiveTopBanner,
        normalTopBanner,
        setNormalTopBanner,
        updateHeaderdetails,
      }}
    >
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeaderdetails = () => {
  return useContext(HeaderContext);
};