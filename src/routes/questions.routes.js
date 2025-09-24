import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import phq9Questions from "../data/phq9.json" with { type: "json" };
import gad7Questions from "../data/gad7.json" with {type:"json"}
import ghqQuestions from "../data/ghq12.json" with {type:"json"}



router.get("/phq9",(req,res)=>{
    res.status(200).json({
        testType:"PHQ-9",
        totalQuestions:phq9Questions.length,
        questions:phq9Questions
    });
})

router.get("/gad7",(req,res)=>{
    res.status(200).json({
        testType:"GAD7",
        totalQuestions:gad7Questions.length,
        questions:gad7Questions
    })
})

router.get("/ghq12",(req,res)=>{
     res.status(200).json({
        testType:"General Health Questionnaire (GHQ-12)",
        totalQuestions:ghqQuestions.length,
        questions:ghqQuestions
    });
})




//extra wale yaha kr

router.get("/:testName",(req,res)=>{

    const {testName} = req.params;
    // const filePath = path.join(__dirname,"../data",`${testName.toLowerCase()}.json()`);
    const filePath = path.join(__dirname, "../data", `${testName.toLowerCase()}.json`);
    if(!fs.existsSync(filePath)){
        return res.status(404).json({success:false,message:"Test not found"})
    };

    try{
        const data = JSON.parse(fs.readFileSync(filePath,"utf-8"));
        return res.status(200).json({data});
    }catch(err){
        console.error(err);

        return res.status(500).json({success:false,message:"Server error"});
        
    }
})



/* Questions 1, 4, 5, 7 → reverse scored (high score = low loneliness).

Total score = 8–32 → gives overall loneliness level. */


export default router;