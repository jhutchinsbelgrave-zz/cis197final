'use strict';
const BootBot = require('bootbot');
const config = require('config');
var mongoose = require('mongoose');
var Room = require('./models/room');
var Roommate = require('./models/roommate');
var Chore = require('./models/chore');

const bot = new BootBot({
  accessToken: config.get('accessToken'),
  verifyToken: config.get('verifyToken'),
  appSecret: config.get('appSecret')
});

const options = { typing: true };
var isShortTerm = true;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/roommate-bot')

/* *
 * Sets up Starting Prompts
*/
var started = (payload, chat) => {
  const welcome2 = `If you ever need help, you can either type \'Help\', `+
  `use the persistent menu, or just email my developer ` +
  `Jelani Hutchins-Belgrave at: jelani@seas.upenn.edu!`;
  chat.getUserProfile().then((user) => { 
  	chat.say(`What's going on, ${user.first_name}! Call me Rommy!`,
  	 options).then(() => 
  		chat.say(welcome2, options)).then(() =>
  		 chat.say("Let's see if you're a current user of our bot!", 
  		 	options)).then(() => {
				Roommate.findOne({ roommateId: `${user.id}`}, function (err, result) {
			        if (result != null) {
			          chat.say(`You're in luck ${user.first_name}! We found data in our db!`)
			          .then(()=> chat.say({text: "What next?", 
			          	quickReplies: ["My Data", "Room", "Help"]}));
			        } else {
			          chat.say(`Unfortunately, I found no data. Let's register you!`);
			          var roomie = new Roommate({roommateId : `${user.id}`, 
			          roommateName: `${user.first_name}`, chores: [], roomId: 0});
			          roomie.save( function (err, result) {
			          	if (!err) {
			          	   chat.say(`${user.first_name} we got you in!`);
			          	} else {
			          	   chat.say("Yikessssss! We got an error! Let me fix that");
			          	}
			          })

			        }
			    });
  			})
  });
}

bot.hear('Get Started', started);

/* *
 * Sets up Help Menu Prompts
*/
const helpMenu = (payload, chat) => {
  const message = `Type either MY DATA or ROOM to get started!`;
  chat.say(message, options);
};

bot.hear(['help', 'help me'], helpMenu);


/* *
 * Sets up New Menu Prompts
*/
const newRoomMenu = (payload, chat) => {
  const message = `Let's get you some data about your room`;
  chat.getUserProfile().then((user) => 
  	chat.say(message, options).then(() => {
  		Roommate.findOne({ roommateId: `${user.id}`}, "roomId", function (err, result) {
			        console.log(result);
			        if (result != null) {
			          if (result.roomId == 0) {
			          	chat.say(
			          		{
			          			text: "You're not in a room. Let's get you in one.",
			          			quickReplies: ["Join A Room", "Create A Room"]
			          		}
			          	)
			          } else {
			          	Room.findOne({roomId : result.roomId}, function (err, data) {
			          		if (data != null) {
			          			chat.say("Here's a General Overview of your room.").then(() =>
			          				chat.say("Your room\'s name is: " + data.roomName).then(() =>
			          					chat.say("The current residents are: " + data.roommates).then(() =>
			          						chat.say("Your room has " + data.chores.length + " chore(s)")
			          					)
			          				)
			          			)
			          		} else {
			          			chat.say("I got the following while trying to look your room up: " + err);
			          		}
			          	})
			          }
			        } else {
			          chat.say(
			          	{
			          			text: "Here's the error I got checking for your data." ,
			          			quickReplies: ["Join A Room", "Create A Room"]
			          	}
			          )

			        }
	    })
  	})
  );
};

bot.hear([`room`], newRoomMenu);

/* *
 * Sets up Creating Room
*/
const createRoom = (payload, chat) => {
	var name = "";
	var password = "";
	var id = Math.floor((Math.random() * 10000000) + 1);

	chat.getUserProfile().then((user) => {

		const askRoomName = (convo) => {
			convo.ask(`What's your room name going to be?`, (payload, convo) => {
				const text = payload.message.text;
				convo.set('name', text);
				name = "" + text;
				convo.say(`Great, we'll make the room name ${name}`).then(() => 
					askRoomPassword(convo)), options;
		    }, options);
		};


		const askRoomPassword = (convo) => {
			convo.ask(`What's your room password going to be?`, (payload, convo) => {
				const text = payload.message.text;
				convo.set('password', text);
				password = "" + text;
				convo.say(`Cool, make sure to write that password down to share with` +
					` others looking to join your room`).then(() => addRoomData(convo));
		    });
		}

		const addRoomData = (convo) => {
			console.log("hit");
			convo.ask(`I'm going to submit your data. Is that ok? Type YES or NO`, 
				(payload, convo) => {
				const text = payload.message.text;
				if (text.toLowerCase() == "yes") {
					var aRoom = new Room({
						roomName: name, 
						roomId: id, 
						roomPassword: password,
						chores: [],
						manager: `${user.id}`,
						roommates: [`${user.first_name}`],
						roommatesIds: [`${user.id}`]
					});

					aRoom.save( function (err, result) {
			          	if (!err) {
			          	   console.log("the id:" + id);
			          	   convo.say(`${user.first_name} you have now created a room!`).then(() => {
			          	   	Roommate.findOne({roommateId : `${user.id}`}, function (err, result) {
			          	   		if (result != null) {
			          	   			result.roomId = id;
			          	   			result.save(function (err, result) {
			          	   				if (!err) {
			          	   					convo.say(`${user.first_name} you are now ` + 
					          	   			`officially a roommate!`);
			          	   				} else {
			          	   					convo.say("Yikessssss! We got an error: " + err)
			          	   					.then(() => convo.end());;
			          	   				}
			          	   			})
			          	   		} else {
									convo.say("Yikessssss! We got an error: " + err)
									.then(() => convo.end());;
			          	   		}
					        })
			          	   })
			          	} else {
			          	   convo.say("Yikessssss! We got an error: " + err)
			          	   .then(() => convo.end());;
			          	}
			        });

				} else {
					convo.ask(`Do you want to reset the room name or the password`, (payload, convo) => {
						const msg = payload.message.text;
						if (/^[a-zA-Z\s]+$/.test(msg)) {
							if (msg.toLowerCase() == "room name" ||  msg.toLowerCase() == "the room name" ||
								msg.toLowerCase() == "name") {
								askRoomName(convo);
							} else if (msg.toLowerCase() == "password" || msg.toLowerCase() == "the password") {
								askRoomPassword(convo);
							}
						} else {
							convo.say("Unfortunately, I didn't understand the message, I'm going" + 
								"to have to start you from the beginning of the process.").then(() =>
								askRoomName(convo)
							);
						}
						
					});
				}
		    });
	    }

	    chat.conversation((convo) => {
		    askRoomName(convo);
		});
	});

	
}

bot.hear(['create a room', `create`, `make`], createRoom);


/* *
 * Sets up Joining a Room
*/

const joinRoom = (payload, chat) => {
	var name = "";
	var password = "";

	chat.getUserProfile().then((user) => {

		const askRoomName = (convo) => {
			convo.ask(`What's the name of the room?`, (payload, convo) => {
				const text = payload.message.text;
				convo.set('name', text);
				name = "" + text;
				console.log("This is the text: " + text);
				askRoomPassword(convo);
		    });
		};


		const askRoomPassword = (convo) => {
			convo.ask(`What's the room password?`, (payload, convo) => {
				const text = payload.message.text;
				convo.set('password', text);
				password = "" + text;
				console.log("This is the text: " + text);
				findRoomData(convo);
		    });
		}

		const findRoomData = (convo) => {
			convo.ask(`Are you sure this data is correct? Type yes or no`, (payload, convo) => {
				const text = payload.message.text;
				console.log("This is the text: " + text);
				if (text.toLowerCase() == "yes") {
					console.log(text);
					var aRoom = {
						roomName: name, 
						roomPassword: password
					};

					Room.findOne({aRoom}, "roommates roomId", function (err, result) {
		          		if (result != null) {
		          			convo.say("It's lit!!! You have successfully got into the room!").then(() =>
		          				convo.say("Now let's put you as a roommate").then(() => {
		          					result.roommates.push(`${user.id}`);
		          					result.roommates = result.roommates;
		          					result.save( function (err, data) {
							          	if (!err) {
							          	   Roommate.findOne({ roommateId: `${user.id}` }, 
							          	   	"roomId", function (err, res) {
									          	if (result != null) {
									          	   res.roomId = result.roomId;
									          	   res.save(function (err, da) {
										          	   	if (!err) {
										          	   		convo.say(`${user.first_name} you are now`
										          	   		 + ` officially a roommate!`);
										          	   	} else {
										          	   		convo.say("Yikessssss! We got an error:" 
										          	   			+ " "+ err).then(() => convo.end());
										          	   	}
									          	   })

									          	   
									          	} else {
									          	   convo.say("Yikessssss! We got an error: " + err)
									          	   .then(() => convo.end());
									          	}
									        });
							          	} else {
							          	   convo.say("Yikessssss! We got an error: " + err)
							          	   .then(() => convo.end());
							          	}
							        });
		          				})
		          			)
		          		} else {
		          			convo.say("I got the following while trying to look your room up" + err)
		          			.then(() => convo.end());
		          		}
		          	})

				} else {
					convo.ask(`Do you want to reenter the room name or the password`, (payload, convo) => {
						const msg = payload.message.text;
						if (/^[a-zA-Z\s]+$/.test(msg)) {
							if (msg.toLowerCase() == "room name" ||  msg.toLowerCase() == "the room name" ||
								msg.toLowerCase() == "name") {
								askRoomName(convo);
							} else if (msg.toLowerCase() == "password" || msg.toLowerCase() == "the password") {
								askRoomPassword(convo);
							}
						} else {
							convo.say("Unfortunately, I didn't understand the message, I'm going" + 
								"to have to start you from the beginning of the process.").then(() =>
								askRoomName(convo)
							);
						}
						
					});
				}
		    })
	    }

	    chat.conversation((convo) => {
			askRoomName(convo);
	    });
	});
}

bot.hear(['join a room', `join`], joinRoom);



bot.setPersistentMenu([
  { type: 'postback', title: 'Progress', payload: 'MENU_PROGRESS'},
  { type: 'postback', title: 'Room', payload: 'MENU_ROOM'},
  { type: 'postback', title: 'Help', payload: 'MENU_HELP' }
]);

bot.on('postback:MENU_ROOM', newRoomMenu);
bot.on('postback:MENU_HELP', helpMenu);

/* *
 * Sets up Roomy Assistant
*/
bot.hear(['Dashboard', 'Overview', 'roomy'], (payload, chat) => {
	chat.getUserProfile().then((user) => {
		chat.say({
			text: `What can I help you with today, ${user.first_name}?`,
			quickReplies: [`My Data`, 
			'See My Room\'s Data', 'Help']
	    }, options);
	});
});

bot.hear(["progress", "my data"], (payload, chat) => {
	chat.getUserProfile().then((user) => {
		chat.say({
			text: 'What can I help you with today?',
			quickReplies: [`My Progress Report`, 
			'Chore Actions', 'Help']
	    }, options);
	});
});

/* *
 * Sets up Different Chore Menu Actions
*/
bot.hear(["chores",'chore actions'],
 (payload, chat) => {
	// Send a text message with quick replies
	chat.getUserProfile().then((user) => {
		chat.say({
			text: 'What can I help you with today?',
			quickReplies: [`Add a Chore`, `Complete a Chore`, 'Remove a Chore']
	    }, options);
	});
});

/* *
 * Sets up Adding a chore
*/

const addChore = (payload, chat) => {
	var name = "";
	var id = Math.floor((Math.random() * 10000000) + 1);
	var isShort = true;
	var deadline = "";

	chat.getUserProfile().then((user) => {
		const askChoreName = (convo) => {
			convo.ask(`What's the name of the chore?`, (payload, convo) => {
				const text = payload.message.text;
				convo.set('name', text);
				name = "" + text;

				convo.say("Bet!").then(() => askChoreTerm(convo));
		    });
		};

		const askChoreTerm = (convo) => {
			convo.ask({ text: `Is the chore short term or long term?`, quickReplies: ['Short', 'Long']  
				}, (payload, convo) => {
				const text = payload.message.text;
				convo.set('name', text);
				if (text.toLowerCase() == 'long' || text.toLowerCase() == 'long term') {
					isShort = false;
				}

				if (isShort) {
					convo.say("You're going to be adding a short term chore").then(() => askChoreDeadline(convo));
				} else {
					convo.say("Word on road is you're going to be adding a long term chore").then(() => 
						askChoreDeadline(convo));
				}
		    });
		};

		const askChoreDeadline = (convo) => {
			var today = new Date();
			var dd = today.getDate();
			var mm = today.getMonth() + 1;
			var yyyy = today.getFullYear();
			var oneDay = dd + 1;
			var twoDay = dd + 2;
			var oneWeek = dd + 7;
			var twoWeek = dd + 14;
			var oneMonth = 1;
			console.log(today);
			convo.ask({ text: `When is this chore due? Please choose from a date below!`, 
				quickReplies: [
					'' + mm + "/" + oneDay + "/" + yyyy, 
					'' + mm + "/" + twoDay + "/" + yyyy,
					'' + mm + "/" + oneWeek + "/" + yyyy,
					'' + mm + "/" + twoWeek + "/" + yyyy,
					'' + oneMonth + "/" + dd + "/2019"
				]}, (payload, convo) => {

				const text = payload.message.text;
				if (text.split("/").length != 3) {
					convo.say("The inputted date was not formatted correctly," +
					 "I'm sending you back").then(() => askChoreDeadline(convo)); 
				} else {
					deadline = text;
					convo.say("I'll send you a notification on " + text + " to see if you did the task").then(() => 
						addChoreData(convo));
				}
		    });
		}

		const addChoreData = (convo) => {
			Roommate.findOne({roommateId: `${user.id}`}, "roomId chores", function (err, result) {
		          		if (result != null) {
		          			var ch = new Chore({chordId: id, choreName: name, 
		          				roommateId: `${user.id}`, roomId: result.roomId, term: true
		          			})
		          			ch.save( function (err, bdata) {
		          				if (!err) {
		          					result.chores.push(id);
		          					console.log(result.chores);
		          					result.save( function (err, data) {
		          						if (!err) {
		          							Room.findOne({roomId: result.roomId}, "chores", 
		          								function (err, roomResult) {
		          								if (roomResult != null) {
		          									roomResult.chores.push(id);
		          									console.log(roomResult.chores);
		          									roomResult.save(function (err, finData) {
		          										if (!err) {
		          											convo.say("Successfully got the chore" + 
		          												" information stored").then(() => 
		          												convo.end());
		          								        } else {
		          								        	convo.say("Unable to save chore to room")
		          									    }
		          									})
		          									
		          								} else {
		          									convo.say("Unable to find the room data for chores");
		          								}
		          							})
		          						} else {
		          							convo.say("Unable to save chore to user's list of chores");
		          						}
		          					})
		          				} else {
		          					convo.say("There was this err when adding chore: " + err);
		          				}
		          			})
		          		} else {
		          			convo.say("Unfortunately, you can't add a chore, since you don't" + 
		          				" have a room. Try calling create and coming back later.");
		          		}
		          	})
		}

		chat.conversation((convo) => {
			askChoreName(convo);
	    });
	});
}

bot.hear(["Add a Chore", "add"],
 (payload, chat) => {
	addChore(payload, chat);
});

/* *
 * Sets up Removing or Completing a Chore
*/
const adjustChore = (payload, chat) => {
	var name = "";
	var id = Math.floor((Math.random() * 10000000) + 1);
	var isShort = true;
	var deadline = "";

	chat.getUserProfile().then((user) => {
		const askChoreName = (convo) => {
			convo.ask(`What's the name of the chore?`, (payload, convo) => {
				const text = payload.message.text;
				convo.set('name', text);
				name = "" + text;

				convo.say("So, you finished " + text)
				.then(() => convo.ask(
					{
						text: "Did you complete the chore or want to remove it",
						quickReplies : ["Complete", "Remove", "Neither"]
					}, (payload, convo) => {
						const t = payload.message.text;
						if (t.toLowerCase() == "complete" || t.toLowerCase() == "remove") {
							convo.then(() => changeChore(convo));
						} else {
							convo.say("Come back when you finish a chore!").then(() => convo.end())
						}
					}
				)).then(() => changeChore(convo));
		    });
		};

		const changeChore = (convo) => {
			Chore.findOne({roommateId: `${user.id}`, choreName: name}, "choreId",function (err, choreData) {
				if (result != null) {
					Chore.deleteOne({roommateId: `${user.id}`, choreName: name}, function (err) {
		          		if (!err) {
  							Roommate.findOne({roommateId: `${user.id}`}, "roomId chores", 
  								function (err, result) {
	  								if (result != null) {
	  									for( var i = 0; i < result.chores.length; i++){ 
										   if ( result.chores[i] === choreData.choreId) {
										     arr.splice(i, 1);
										     break;
										   }
										}

										result.save(function(err, d){
											if (!err) {
												Room.findOne({roomId: result.roomId}, "roomId chores", 
				  								function (err, f) {
					  								if (f != null) {
					  									for( var i = 0; i < f.chores.length; i++){ 
														   if ( f.chores[i] === choreData.choreId) {
														     arr.splice(i, 1);
														     break;
														   }
														}

														f.save(function(err, d){
															if (!err) {
																convo.say("Successfully removed chored");
															} else {
																convo.say("Unable to save changes to room")
																	.then(() => convo.end());
															}
														})
													} else{
														convo.say("Unable to find room to update chores").then(() =>
				  											convo.end());
													}
												});
											} else {
												convo.say("Unable to save changes to roommate").then(() =>
  													convo.end());
											}
										})
									} else{
										convo.say("Unable to find roommate to update chores").then(() =>
  											convo.end());
									}
								});
  						} else {
  							convo.say("Unable to delete chore from the chore table").then(() =>
  								convo.end());
  						}
		        	})
				} else {
					convo.say("The entry doesn't exist in chores").then(() =>
  						convo.end());
				}
				
			})
		}

		chat.conversation((convo) => {
			askChoreName(convo);
	    });
	});
}

bot.hear(["Complete a Chore", "complete", "remove", "Remove a Chore"],
 (payload, chat) => {
	adjustChore(payload, chat);
});

bot.hear(["My Progress Report"],
 (payload, chat) => {
	chat.say({
		text: "Where do you want to go from here?",
		quickReplies: ["See Your Chores", "Chore Actions", "Help"]
	})
});

const seeChores = (payload, chat) => {
	chat.getUserProfile().then((user) => {
		const getChoreData = (convo) => {
			Roommate.findOne({roommateId: `${user.id}`}, function(err, result) {
				if (result != null) {
					if (result.chores != undefined) {
						for(var i = 0; i < result.chores.length; i++){
							Chore.findOne({choreId: result.chores[i], roommateId: `${user.id}`},
							 function(err, cData) {
								if (cData != null) {
									convo.say("The Chore Name is: " + cData.choreName + "\n The deadline was" +
										" listed as: " + cData.deadline);
								} else {
									convo.say("There's some missing info from this chore");
								}
								
							})
						}
					} else {
						chat.say({
							text: "It looks as if you have no chores as of yet!",
							quickReplies: ["Add a Chore", "Help"] 
						})
					}
					
				} else {
					chat.say({
						text: "It seems you don't have data really. Let's head over to Room.",
						quickReplies: ["Room", "Help"]
					})
				}
			})
		};

		chat.conversation((convo) => {
		    getChoreData(convo);
		});
	});

	
}

/* *
 * Allows the user to see their chores
*/
bot.hear(["See Your Chores", "see"],
 (payload, chat) => {
	seeChores(payload, chat);
});

const seeRoomChores = (payload, chat) => {
	chat.getUserProfile().then((user) => {
		const getChoresData = (convo) => {
			Roommate.findOne({roommateId: `${user.id}`}, function(err, result) {
				if (result != null) {
					Room.findOne({roomId: result.roomId}, function(err, roomData) {
						if (roomData != null) {
							for(var i = 0; i < roomData.chores.length; i++){
								console.log(roomData.chores);
								Chore.findOne({choreId: roomData.chores[i]}, function(err, cData) {
									console.log(cData)
									//convo.say("The Chore Name is: " + cData.choreName + "\n The deadline was" +
										//" listed as: " + cData.deadline);
									
								})
							}
						} else {
							convo.say({
								text:"For some reason the room has no data!", 
								quickReplies: ["Room", "Help"]
							});
						}
						
					})
				} else {
					chat.say({
						text: "It seems you don't have data really. Let's head over to Room.",
						quickReplies: ["Room", "Help"]
					})
				}
			})
		};

		chat.conversation((convo) => {
		    getChoresData(convo);
		});
	});

	
}

bot.hear(["See Room Chores"],
 (payload, chat) => {
	seeRoomChores(payload, chat);
});

bot.setGetStartedButton(started);


bot.start(config.get('botPort'));
