import { useState } from "react";
import { useParams } from "react-router-dom";
import React from "react";
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
 * Style the label data format for one chosen data display
 * Account for minority selection
 */
function updateData(currentData,minoritySelection, secondData, thirdData)
{
    switch (currentData) 
    {
        case "GUI-4":
            {
                const minorityHM =  <div className="minorityAnalysis_data">{minoritySelection} Heat Map</div> // The actual heatmap
                // Formatted in label data format
                return displayData(<div className="minorityAnalysis_dataLabel">{minoritySelection}Heat Map of {minoritySelection}</div>, minorityHM,"minorityAnalysis_dataContainer");
            }
        case "GUI-12":
            {

                if(secondData == "Minority")
                {
                    switch (thirdData) // Contains some minority
                    {
                        case value:
                            
                            break;
                    
                        default:
                            console.error(`StateCustomAnalysis: updateData: could not discern value of third dropdown ${thirdData}`)
                            break;
                    }
                }
                else if(secondData== "Language")
                {
                    switch (thirdData) // Contains some language group
                    {
                        case value:
                            
                            break;
                    
                        default:
                            console.error(`StateCustomAnalysis: updateData: could not discern value of third dropdown ${thirdData}`)

                            break;
                    }
                }
                else
                {
                    console.error(`StateCustomAnalysis: updateData: could not discern value of second dropdown ${secondData}`)
                }
                
            }
        case "GUI-5":
        case "GUI-6":
        case "GUI-7":
        case "GUI-8":
        case null:
            {
                const minorityHM =  <div className="minorityAnalysis_data">Assigned to {currentData}</div> // The actual heatmap
                // Formatted in label data format
                return displayData(<div className="minorityAnalysis_dataLabel">Some display of {currentData}</div>, minorityHM,"minorityAnalysis_dataContainer");

            }
                
    
        default:
            console.error(`StateCustomAnalysis: updateData: currentData doesn't match a GUI usecase ${currentData}`)
            break;
    }
}
/**
 * Meant to return an updated body of minorityAnalysis
 * @param {*} minority Chosen minority from the current page, if needed
 * @param {*} minorityList Current list of minorities (convenience data)
 * @param {*} minorityData List of minority data, if needed
 * @return JSX element of the body reflecting the current minority
 */
/**
 * 
 * @param {*} minority 
 * @param {*} minorityList 
 * @param {*} minorityData 
 * @param {*} XDataY The Y dropdown (from the total available) corresponding to the data position X (first chart second dropdown X=1 Y=2)
 * @returns 
 */
function updateBody(minority, minorityList, minorityData, currentData1, secondData1, thirdData1, currentData2, secondData2, thirdData2, currentData3,secondData3,thirdData3)
{
    // let index = minorityList.indexOf(minority);
    // let minorityObject = minorityData[index]; 
    // Now have the relevant object that the minority data is stored inside, update the relevant charts and proceed

    // let minorityHM = <div className="minorityAnalysis_data">{minority} Heat Map</div>
    // let minorityHMWithLabel = displayData(
    // <div className="minorityAnalysis_dataLabel">Heat Map of {minority}</div>,
    // minorityHM,
    // "minorityAnalysis_dataContainer");
    // let distributionBW = <div className="minorityAnalysis_data">Distribution of {minority} through Box and Whiskers</div>
    // let distributionBWWithLabel = displayData(<div className="minorityAnalysis_dataLabel">{minority} Distribution by Precincts in an Ensemble</div>, distributionBW,"minorityAnalysis_dataContainer");
    // let candidateEI1 = <div className="minorityAnalysis_data">Dummy EI</div>
    // let candidateEIWithLabel1 = displayData(<div className="minorityAnalysis_dataLabel">Support For INSERT CANDIDATE 1</div>,candidateEI1,"minorityAnalysis_dataContainer")
    // let candidateEI2 = <div className="minorityAnalysis_data">Dummy EI</div>
    // let candidateEIWithLabel2 = displayData(<div className="minorityAnalysis_dataLabel">Support For INSERT CANDIDATE 2</div>,candidateEI2,"minorityAnalysis_dataContainer")

    // Get the actual placements of the data with labels
    const firstData = updateData(currentData1,minority,secondData1,thirdData1);
    const secondData = updateData(currentData2,minority,secondData2,thirdData2);
    const thirdData = updateData(currentData3,minority,secondData3,thirdData3);


    // Display the minority content
    let displayBody = (<div className="customAnalysis_dataBodyContainer">
                    {firstData}
                    {secondData}
                    {thirdData}
    </div>);
    // (<div className="minorityAnalysis_dataBodyContainer">
    //                     {minorityHMWithLabel}
    //                     {distributionBWWithLabel}
    //                     {candidateEIWithLabel1} {/*Thankfully only 2 candidates EIs */}
    //                     {candidateEIWithLabel2}
    //                     </div>)

    return displayBody;
}
function excludeDataFromDropdown(original,comparison1,comparison2)
{
    return ((comparison1 == "GUI-12")|| (original != comparison1)) &&
        ((original != comparison2 )|| (comparison2 == "GUI-12"))
}
/**
 * 
 * @param {*} selection1 Value of GUI case
 * @param {*} selection2 
 * @param {*} selection3 
 * @param {*} needsMinority List of GUI cases that need minorities
 * @returns true if none needs it, false if they do
 */
function isMinorityDropdownDisabled(selection1,selection2,selection3,needsMinorityList)
{
    if(needsMinorityList.includes(selection1) || needsMinorityList.includes(selection2) || needsMinorityList.includes(selection3))
    {
        return false
    }
    return true
}

/**
 * Options may have extra drop downs(GUI-12, GUI-16, GUI-17), display them if so
 * @param {*} dataIndex The current data index along the screen, as to uniquely identify from other indices 
 * @param {*} dataSelection The current selection of the data view 
 * @param {*} secondData stateVariable of the second dropdown
 * @param {*} changeSecondData change state of second dropdown
 * @param {*} thirdData repeat second for third
 * @param {*} changeThirdData repeat second for third
 * @param  {...any} dataLists extra data that may need to be passed down (e.g.: GUI-12's minority and language options)
 * @returns JSX.element dropdowns formatted with the labels if have extra dropdowns, else null
 */
function returnExtraDropdownsWithLabels(dataIndex,dataSelection, secondData, changeSecondData, thirdData, changeThirdData, ...dataLists)
{
    switch (dataSelection) 
    {
        case "GUI-12":
        {   // dataList = [dataList1 = minorityList; dataList2 = languageOptions]
            const [minorityList, languageList] = dataLists
            const minorityOptions = minorityList.map((minority)=> <option key={`Extra-Select2-${dataIndex}-${minority}`}>{minority}</option>)
            const languageOptions = languageList.map((language)=> <option key={`Extra-Select2-${dataIndex}-${language}`}>{language}</option>)

            
            return( 
            <>
                <label htmlFor="minorityOrLanguage" className="customAnalysis_extraDropdown1_Label">Minority Or Language Group?</label>
                <select className="customAnalysis_extraDropdown1" name="minorityOrLanguage" id="minorityOrLanguage" value={secondData} onChange={(e) => changeSecondData(e)}>{secondData}
                    <option>Minority</option>
                    <option>Language</option>
                </select>
                <label htmlFor={secondData === "Minority" ? "minorityOptions" : "languageOptions"} className="customAnalysis_extraDropdown2_Label" >{secondData === "Minority" ? "Minority Options" : "Language Options"}</label>
                {secondData === Minority ? 
                    <select name="minorityOptions" id="minorityOptions" value={thirdData} onChange={(e) => changeThirdData(e)} className="customAnalysis_extraDropdown2">{thirdData}
                    {minorityOptions}
                    </select>
                :
                <select name="languageOptions" id="languageOptions" value={thirdData} onChange={(e) => changeThirdData(e)} className="customAnalysis_extraDropdown2">{thirdData}
                    {languageOptions}
                </select>}
        

            </>);
        
            break;
        }
        case "GUI-16":
        case "GUI-17":
        {
            const optionList = ["Voting Rights Act", "Race Blind"].map((value) => <option key={`Extra-Select2-${dataIndex}-${value}`}>{value}</option>)
            // Display "VRA vs Race Blind"
            return(
                <div className="">
                    <label htmlFor="VRAOrRaceblind"  className="customAnalysis_extraDropdown1_Label" >{secondData === "Minority" ? "Minority Options" : "Language Options"}</label>
                    <select name="VRAOrRaceblind" id="VRAOrRaceblind" value={secondData} onChange={(e) => changeSecondData(e)} className="customAnalysis_extraDropdown1">
                    <option>
                        {optionList}
                    </option>
                    </select>
                </div>
            )
            break;
        }
        
    
        default:
            return null;
            break;
    }
}

export default function StateCustomAnalysis(props)
{

    const { stateName } = useParams();
    // Find the relevant data for a minority given the state
    const minorityData = props.minorityData;
    const extraDropDownDatas = [{name: 'GUI-12', numberExtra: 2},{name: 'GUI-16', numberExtra: 1}, {name: 'GUI-17', numberExtra: 1}];
    const needsMinority = ['GUI-4','GUI-9','GUI-12'];

    let data = null;
    for(let d of minorityData)
    {
        if(d.stateName === stateName)
        {
            data=d;
            break;
        }
    }
    if(data === null)
    {
        console.error("StateCustomAnalysis: Could not find minority data linking to the current state");
    }

    
    // Take the minority data and organize it for display
    //Realistically we pass down minority data and derive the groups, probably in some form 
    // of {{minority: minorityName, dataField1: Number, dataArr: Float[]}[]}
    // let minorityData = props.minorityData; 

    // let minorities = minorityData.forEach((entry) => entry.minority); 
    
    // Get minority and language lists
    let minorityList = data.minorityData.minorityList;
    let languageList = ["English", "Spanish", "French"];
    console.log(`Minority List ${minorityList} data ${data}`)

    const dataDescriptionList = ["GUI-4","GUI-5", "GUI-6","GUI-7", "GUI-8"]; // The list holding the description of all the charts, graphs, and tables in a ascending GUI usecase order
    const dataOptions = dataDescriptionList.map((data,index) => <option key={`Data-Descriptions-${index}`} value={data}>{data}</option>)

    const minorityOptions = minorityList.map((minority)=> <option key={`Minority-Options-${minority}`} value={minority}>{minority}</option>)

    // Options for dropdowns
    const [currentMinority, changeMinority] = useState(minorityList[0]); // Record the option chosen inside 
    // Data display dropdowns
    const [currentData1, changeData1] = useState(dataDescriptionList[0]);
    const [currentData2, changeData2] = useState(dataDescriptionList[1]);
    const [currentData3, changeData3] = useState(dataDescriptionList[2]);
    // Need to make sure these are "reset" whenever one of the higher ups are changed as to set a normal default value, if used for other gui use cases
        // Do I? I think its auto-set with the <select value={}> thing
    
    // Second set of dropdowns
    const [secondData1, changeSecondData1] = useState(null);
    const [secondData2, changeSecondData2] = useState(null);
    const [secondData3, changeSecondData3] = useState(null);
    // Third set of dropdowns (MAX 3)
    const [thirdData1, changeThirdData1] = useState(null);
    const [thirdData2, changeThirdData2] = useState(null);
    const [thirdData3, changeThirdData3] = useState(null);



    // Display the minority content
    let displayBody = updateBody(currentMinority,minorityList,props.minorityData,
                                currentData1,secondData1,thirdData1,currentData2,secondData2,thirdData2,
                                currentData3,secondData3,thirdData3);
    return(
    <div className="customAnalysis_bodyContainer">
    <div className="customAnalysis_minorityCheckboxContainer">
        <label htmlFor="minoritySelector">Choose the Minority to analyze: </label>
        <select name="minoritySelector" id="minoritySelector" disabled={isMinorityDropdownDisabled(currentData1,currentData2,currentData3, needsMinority)} value={currentMinority} onChange={(e) => changeMinority(e.target.value)}>
        {minorityOptions}
        </select>
    </div>
    <div className="customAnalysis_dataCheckboxContainer">
        {/* <label htmlFor="dataSelector">Choose the Minority to analyze: </label> */}
        <select name="dataSelector1" id="dataSelector1" value={currentData1} onChange={(e) => {changeData1(e.target.value); changeSecondData1(null); changeThirdData1(null);}}> {/* Update value and reset extra dropdowns */}
        {dataOptions.filter((data) => excludeDataFromDropdown(data.props.value,currentData2,currentData3))} {/* Block out the values the other ones are using, unless its GUI 12 */}
        </select>
        {returnExtraDropdownsWithLabels(1,currentData1,secondData1,changeSecondData1,thirdData1,changeThirdData1, minorityList, languageList)}
        
        <select name="dataSelector2" id="dataSelector2" value={currentData2} onChange={(e) => {changeData2(e.target.value); changeSecondData2(null); changeThirdData2(null);}}>
        {dataOptions.filter((data) => excludeDataFromDropdown(data.props.value,currentData1,currentData3))}
        </select>
        {returnExtraDropdownsWithLabels(2,currentData2,secondData2,changeSecondData2,thirdData2,changeThirdData2, minorityList, languageList)}

        <select name="dataSelector3" id="dataSelector3" value={currentData3} onChange={(e) => {changeData3(e.target.value); changeSecondData3(null); changeThirdData3(null);}}>
        {dataOptions.filter((data) => excludeDataFromDropdown(data.props.value,currentData1,currentData2))}
        </select>
        {returnExtraDropdownsWithLabels(3,currentData3,secondData3,changeSecondData3,thirdData3,changeThirdData3, minorityList, languageList)}
    </div>

    
    {displayBody} {/*Display nothing if not chosen, display minority data once chosen */}
    </div>)
}