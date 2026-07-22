import React from "react";
import { Loader2 } from "lucide-react";

export default function LoadingScreen(){

    return(

        <div className="flex flex-col items-center justify-center h-full">

            <Loader2
                className="animate-spin w-12 h-12"
            />

            <p className="mt-8 text-xl">

                Building Intelligence...

            </p>

        </div>

    )

}