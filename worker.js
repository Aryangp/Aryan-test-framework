const fs =require('fs');
let {expect} =require("expect")
const vm=require("vm");
let mock=require("jest-mock")
exports.runTest=async (fileToBeTested)=>{
    const testResult=await fs.promises.readFile(fileToBeTested,'utf8');

    let testMessage={
        success:true,
        errorMessage:null
    }
    let testName="";
    try{
        expect=expect;
        mock=mock;
        const describeFns=[];
        let currentDescribeFn;
        const describe=(name,fn)=>describeFns.push([name,fn]);
        const it=(name,fn)=>currentDescribeFn.push([name,fn]);
        const context={describe,it,expect,mock};
        vm.createContext(context);
        vm.runInContext(testResult,context);
        for(const [name,fn] of describeFns){
            currentDescribeFn=[];
            testName=name;
            fn();
            for(const [itName,itFn] of currentDescribeFn){
                testName+= ' '+itName;
                itFn();
            }
        }

    }catch(e){
        testMessage.success=false;
        testMessage.errorMessage=testName+' : '+e.message;
    }
    return testMessage;
}