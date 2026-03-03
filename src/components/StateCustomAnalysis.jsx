
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
function updateData(currentData,minoritySelection, secondData,changeSecondData, thirdData, changeThirdData1)
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

            }
    
        default:
            break;
    }
}
/**
 * Meant to return an updated body of minorityAnalysis
 * @param {*} minority 
 * @param {*} minorityList 
 * @param {*} minorityData 
 * @return JSX element of the body reflecting the current minority
 */
function updateBody(minority, minorityList, minorityData, currentData1, changeData1,currentData2, changeData2,currentData3, changeData3)
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

    // Display the minority content
    let displayBody = (<div className="minorityAnalysis_dataBodyContainer">
                        {minorityHMWithLabel}
                        {distributionBWWithLabel}
                        {candidateEIWithLabel1} {/*Thankfully only 2 candidates EIs */}
                        {candidateEIWithLabel2}
                        </div>)
    return displayBody;
}
function excludeDataFromDropdown(original,comparison1,comparison2)
{
    return ((comparison1 == <div>GUI 12</div>)|| (original != comparison1)) &&
        ((original != comparison2 )|| (comparison2 == <div>GUI 12</div>))
}
function isMinorityDropdownDisabled(selection1,selection2,selection3)
{
    // Some actual matching logic to relevant race
    if(selection1 == <div>GUI X</div>)
    {
        return true;
    }
    return false
}
/**
 * 
 * @param {*} dataSelection The current selection of the data view 
 * @returns JSX.element dropdowns formatted with the labels
 */
function returnExtraDropdownsWithLabels(minorityList, languageList, dataSelection, secondData, changeSecondData, thirdData, changeThirdData)
{
    switch (dataSelection) 
    {
        case "GUI-12":

            const minorityOptions = minorityList.map((minority)=> <option key={`Extra-select1-${minority}`}>{minority}</option>)
            const languageOptions = languageList.map((language)=> <option key={`Extra-select1-${language}`}>{language}</option>)

            {
            return( 
            <>
                <label htmlFor="minorityOrLanguage">Minority Or Language Group?</label>
                <select name="minorityOrLanguage" id="minorityOrLanguage" value={secondData} onChange={changeSecondData}>{secondData}
                    <option>Minority</option>
                    <option>Language</option>
                </select>
                <label htmlFor={secondData === "Minority" ? "minorityOptions" : "languageOptions"}></label>
                {secondData === Minority ? 
                    <select name="minorityOptions" id="minorityOptions" value={secondData} onChange={changeSecondData}>{secondData}
                    {minorityOptions}
                </select>
                :
                <select name="minorityOrLanguage" id="minorityOrLanguage" value={thirdData} onChange={changeThirdData}>{thirdData}
                    {languageOptions}
                </select>}
        

            </>);
        }
            break;
    
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
    // Options for dropdowns
    const [currentMinority, changeMinority] = useState(minorityList[0]); // Record the option chosen inside 
    // Data display dropdowns
    const [currentData1, changeData1] = useState("null");
    const [currentData2, changeData2] = useState(null);
    const [currentData3, changeData3] = useState(null);
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



    const dataDescriptionList = ["GUI-4","GUI-5", "GUI-6","GUI-7", "GUI-8"]; // The list holding the description of all the charts, graphs, and tables in a ascending GUI usecase order
    const dataOptions = dataDescriptionList.map((data,index) => <option key={`data ${index}`} value={`data ${index}`}>{data}</option>)

    const minorityOptions = minorityList.map((minority)=> <option key={minority} value={minority}>{minority}</option>)

    // Display the minority content
    let displayBody = updateBody(currentMinority,minorityList,props.minorityData);
    return(
    <div className="customAnalysis_bodyContainer">
    <div className="customAnalysis_minorityCheckboxContainer">
        <label htmlFor="minoritySelector">Choose the Minority to analyze: </label>
        <select name="minoritySelector" id="minoritySelector" disabled={isMinorityDropdownDisabled(currentData1,currentData2,currentData3)} value={currentMinority} onChange={(e) => changeMinority(e.target.value)}>
        {minorityOptions}
        </select>
    </div>
    <div className="customAnalysis_dataCheckboxContainer">
        {/* <label htmlFor="dataSelector">Choose the Minority to analyze: </label> */}
        <select name="dataSelector1" id="dataSelector1" value={currentData1} onChange={(e) => changeData1(e.target.value)}>
        {dataOptions.filter((data) => excludeDataFromDropdown(data,currentData2,currentData3))} {/* Block out the values the other ones are using, unless its GUI 12 */}
        </select>
        {returnExtraDropdownsWithLabels(minorityList, languageList, currentData1,secondData1,changeSecondData1,thirdData1,changeThirdData1)}
        
        <select name="dataSelector2" id="dataSelector2" value={currentData2} onChange={(e) => changeData2(e.target.value)}>
        {dataOptions.filter((data) => excludeDataFromDropdown(data,currentData1,currentData3))}
        </select>
        {returnExtraDropdownsWithLabels(minorityList, languageList, currentData2,secondData2,changeSecondData2,thirdData2,changeThirdData2)}

        <select name="dataSelector3" id="dataSelector3" value={currentData3} onChange={(e) => changeData3(e.target.value)}>
        {dataOptions.filter((data) => excludeDataFromDropdown(data,currentData1,currentData2))}
        </select>
        {returnExtraDropdownsWithLabels(minorityList, languageList, currentData3,secondData3,changeSecondData3,thirdData3,changeThirdData3)}
    </div>

    
    {displayBody} {/*Display nothing if not chosen, display minority data once chosen */}
    </div>)
}