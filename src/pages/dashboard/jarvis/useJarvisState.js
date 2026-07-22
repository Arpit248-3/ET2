import { useState } from "react";
import { EMPTY_BRIEF } from "./types";

export default function useJarvisState(){

    const [mode,setMode]=useState("dashboard");

    const [loading,setLoading]=useState(false);

    const [question,setQuestion]=useState("");

    const [brief,setBrief]=useState(EMPTY_BRIEF);

    return{

        mode,

        setMode,

        loading,

        setLoading,

        question,

        setQuestion,

        brief,

        setBrief

    }

}