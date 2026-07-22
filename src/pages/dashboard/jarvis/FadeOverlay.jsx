import React from "react";

export default function FadeOverlay({visible}){

    return(

        <div

            className={`
            fixed
            inset-0
            bg-black/80
            backdrop-blur-md
            transition-all
            duration-700
            z-50

            ${visible?"opacity-100":"opacity-0 pointer-events-none"}

            `}
        />

    )

}