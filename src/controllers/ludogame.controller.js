import { rollDice } from "../scripts/dice";

export const rollDiceController = (req,res) =>{
    const dice = rollDice();
    res.json({dice});
};