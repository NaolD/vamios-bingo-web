// ===============================
// VAMIOS BINGO
// WALLET UI
// ===============================



async function loadWalletUI(){


const user =
await getCurrentUser();



if(!user){

console.log(
"No user"
);

return;

}





const wallet =
await createWallet(
user.id
);



if(!wallet){

return;

}





const balanceElement =
document.getElementById(
"walletBalance"
);



if(balanceElement){

balanceElement.innerText =
Number(wallet.balance)
.toFixed(2);

}





await loadTransactions(
user.id
);


}







async function loadTransactions(
userId
){



const list =
document.getElementById(
"transactionList"
);



if(!list){

return;

}





const {data,error}
=
await supabaseClient
.from("transactions")
.select("*")
.eq(
"user_id",
userId
)
.order(
"created_at",
{
ascending:false
}
);





if(error){

console.log(error);

return;

}




list.innerHTML="";





if(!data || data.length===0){


list.innerHTML =
"<p>No transactions</p>";


return;


}






data.forEach(t=>{


const item =
document.createElement(
"div"
);



item.className =
"transaction";



item.innerHTML = `

<p>

<b>${t.type}</b>

<br>

${t.description || ""}

<br>

Amount:
${t.amount} ETB

<br>

Status:
${t.status}

</p>

<hr>

`;



list.appendChild(
item
);



});


}