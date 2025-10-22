/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const REMIX_IDEAS = [
    "to try different hairstyles.",
    "to turn your pet into a cartoon character.",
    "to create a fantasy version of yourself.",
    "to design a superhero based on your photo.",
    "to place yourself in famous historical events.",
    "to generate a custom video game avatar.",
];

const Footer = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setIndex(prevIndex => (prevIndex + 1) % REMIX_IDEAS.length);
        }, 3500); // Change text every 3.5 seconds

        return () => clearInterval(intervalId);
    }, []);

    return (
        <footer className="fixed bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-3 z-50 text-neutral-300 text-xs sm:text-sm border-t border-white/10">
            <div className="max-w-screen-xl mx-auto flex justify-center items-center px-4">
                <p className="text-neutral-500">Powered by Gemini 2.5 Flash Image via OpenRouter</p>
            </div>
        </footer>
    );
};

export default Footer;
