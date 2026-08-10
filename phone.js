// ===============================
// VAMIOS BINGO
// PHONE SETUP
// ===============================


const savePhoneBtn =
document.getElementById(
"savePhoneBtn"
);



if(savePhoneBtn){


savePhoneBtn.onclick =
async ()=>{


const phone =
document
.getElementById(
"phoneInput"
)
.value
.trim();



if(!phone){

alert(
"Enter phone number"
);

return;

}



const user =
await getCurrentUser();



if(!user){

alert(
"User not found"
);

return;

}





const {error}
=
await supabaseClient
.from("users")
.update({

phone:phone

})
.eq(
"id",
user.id
);





if(error){

console.log(error);

alert(
"Phone save failed"
);

return;

}




showScreen(
"lobbyScreen"
);


loadRooms();


};


}