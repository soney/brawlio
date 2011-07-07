var email = require("emailjs/email");

function generate_key() {
	//Generatea random number, convert to base-36 and slice off the decimal
	return Math.random().toString(36).slice(2);
}

var server = email.server.connect({
	user: "brawliocom", 
	password: "townsend", 
	host: "smtp.gmail.com", 
	ssl: true
});


function send_reg_email(user, email_addr, reg_key) {
	var reg_url = "localhost:8000/register/"+reg_key;
	var text = "To register yor username '"+user+"', please visit "+ reg_url;

	var headers = {
		from:		"Brawl I/O <brawliocom@gmail.com>" 
		, to:		email_addr
		, subject:	"Welcom to Brawl I/O"
		, text:		text 
	};

	var message = email.message.create(headers);

	message.attach_alternative("<html>To register <strong>"+user+"</strong>, visit <a href='http://"+reg_url+"'>"+reg_url+"</html>");

	server.send(message, function(err, message) {console.log(err || message);});
}

exports.generate_key = generate_key;
exports.send_reg_email = send_reg_email;
