function Count(n)
{
    const result={};
    for(let l of n)
    {
        if(result[l])
        {
            result[l]++;
        }
        else
        {
            result[l]=1;
        }
    }
    console.log(result);
    
}
Count(["hensy","hit","hensy","bhagwaan"]);