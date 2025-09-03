// String: aaabbbacc
// 1st Output: a= 4 b=3 c=2
// 2nd Output: c=2 b=3 a=4


function Prog()
{
    let s1="aaabbbacc";
    let count=[];
    for(s of s1)
    {
      if(count[s])
      {
        count[s]++;
      }
      else
      {
        count[s]=1;
      }
    }
    console.log(count);
    let i=0;
    for(c in count)
    {
        for(i=c;i>0;i++)
        {
            console.log(c[i]);
        }
    }
    let

}
Prog();


let str = "hello world";
let result = str.split(" ").map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
).join(" ");
console.log(result); 


let str = "hello world";
let vowels = str.match(/[aeiou]/gi);
console.log(vowels ? vowels.length : 0); 
