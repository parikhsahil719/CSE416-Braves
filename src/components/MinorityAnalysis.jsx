import React from "react";
import { useState } from "react";
import '../../styles/minority-analysis.css'
/**
 * Export representation of data in the form of 
 * <div label>
 * <data map
 * Width and Height are in rem, null to indicate its default(no modification). 
    * If want to set custom size, set them and they will be reflected with inline styles
 */
export function displayData(label=<div>this is label</div>, data=<div>this is data</div>,containerClassName="",  widthOfData=null, heightOfData=null)
{

    let style = {};
    if(widthOfData)
    {
        style['width'] =  widthOfData + 'rem';

    }
    if(heightOfData)
    {
        style['height'] =  heightOfData + 'rem';
    }


    return(
        <div className={containerClassName}>
            {label}
            <div style={Object.keys(style).length === 0 ? undefined : style}>
                {data}
            </div>
        </div>
    )
}
/**
 * Meant to return an updated body of minorityAnalysis
 * @param {*} minority 
 * @param {*} minorityList 
 * @param {*} minorityData 
 * @return JSX element of the body reflecting the current minority
 */
function updateBody(minority, minorityList, minorityData)
{
    // let index = minorityList.indexOf(minority);
    // let minorityObject = minorityData[index]; 
    // Now have the relevant object that the minority data is stored inside, update the relevant charts and proceed

    // let minorityHM = <div className="minorityAnalysis_heatMap">{minority} Heat Map</div>
    // let minorityHMWithLabel = displayData(<div className="minorityAnalysis_heatMapLabel">Heat Map of {minority}</div>,minorityHM,"minorityAnalysis_heatMapContainer");
    // let distributionBW = <div className="minorityAnalysis_boxWhiskers">Distribution of {minority} through Box and Whiskers</div>
    // let distributionBWWithLabel = displayData(<div className="minorityAnalysis_boxWhiskersLabel">{minority} Distribution by Precincts in an Ensemble</div>, distributionBW,"minorityAnalysis_boxWhiskersContainer");
    // let candidateEI1 = <div className={undefined}>Dummy EI</div>
    // let candidateEIWithLabel1 = displayData(<div className="minorityAnalysis_ecologicalInferenceLabel1">Support For INSERT CANDIDATE 1</div>,candidateEI1,"minorityAnalysis_ecologicalInferenceContainer1")
    // let candidateEI2 = <div className={undefined}>Dummy EI</div>
    // let candidateEIWithLabel2 = displayData(<div className="minorityAnalysis_ecologicalInferenceLabel2">Support For INSERT CANDIDATE 2</div>,candidateEI2,"minorityAnalysis_ecologicalInferenceContainer2")

    let minorityHM = <div className="minorityAnalysis_data">{minority} Heat Map</div>
    let minorityHMWithLabel = displayData(<div className="minorityAnalysis_dataLabel">Heat Map of {minority}</div>,minorityHM,"minorityAnalysis_dataContainer");
    let distributionBW = <div className="minorityAnalysis_data">Distribution of {minority} through Box and Whiskers</div>
    let distributionBWWithLabel = displayData(<div className="minorityAnalysis_dataLabel">{minority} Distribution by Precincts in an Ensemble</div>, distributionBW,"minorityAnalysis_dataContainer");
    let candidateEI1 = <div className="minorityAnalysis_data">Dummy EI</div>
    let candidateEIWithLabel1 = displayData(<div className="minorityAnalysis_dataLabel">Support For INSERT CANDIDATE 1</div>,candidateEI1,"minorityAnalysis_dataContainer")
    let candidateEI2 = <div className="minorityAnalysis_data">Dummy EI</div>
    let candidateEIWithLabel2 = displayData(<div className="minorityAnalysis_dataLabel">Support For INSERT CANDIDATE 2</div>,candidateEI2,"minorityAnalysis_dataContainer")

    // Display the minority content
    let displayBody = (<div className="minorityAnalysis_dataBodyContainer">
                        {minorityHMWithLabel}
                        {distributionBWWithLabel}
                        {candidateEIWithLabel1} {/*Thankfully only 2 candidates EIs */}
                        {candidateEIWithLabel2}
                        </div>)
    return displayBody;
}
export default function MinorityAnalysis(props)
{
    // let displayBody = [];

    // Take the minority data and organize it for display
    //Realistically we pass down minority data and derive the groups, probably in some form 
    // of {{minority: minorityName, dataField1: Number, dataArr: Float[]}[]}
    // let minorityData = props.minorityData; 

    // let minorities = minorityData.forEach((entry) => entry.minority); 
    
    // Simplicity of testing, I'm using a dummy minority list
    let minorityList = ['Asian', 'Black', 'Latino'];
    const [currentMinority, changeMinority] = useState(minorityList[0]); // Record the option chosen inside 

    const minorityOptions = minorityList.map((minority)=> <option key={minority} value={minority}>{minority}</option>)

    // Display the minority content
    let displayBody = updateBody(currentMinority,minorityList,props.minorityData);
    return(
    <div className="minorityAnalysis_bodyContainer">
    <div className="minorityAnalysis_checkboxContainer">
        <label htmlFor="minoritySelector">Choose the Minority to analyze: </label>
        <select name="minoritySelector" id="minoritySelector" value={currentMinority} onChange={(e) => changeMinority(e.target.value)}>
        {minorityOptions}
        </select>
    </div>
    
    {currentMinority=== "" ? <div></div>: displayBody} {/*Display nothing if not chosen, display minority data once chosen */}
    </div>)
}