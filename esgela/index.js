const express= require('express');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose')
const ejs = require('ejs')
const path = require('path');
const app = express()

require('dotenv').config();
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname, 'public')));


//using css from the public folder
app.use('public/style/style.css',express.static(path.join(__dirname +'public/style/style.css')));
//importing from env
db = process.env.MONGO_URL;
port = process.env.PORT;
//Creating Email Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// setting ejs
app.set('view engine', 'ejs');
//connecting to mongoDB
mongoose.connect(db).then(()=>{
    console.log('Database connected Successfully')
}).catch(()=>{
    console.log(`Couldn't connect to the database`)
});
//creatng Schema for applicants
const applicantSchema = new mongoose.Schema({
 title:{type:String,required:true}, name: {type:String, required:true},surname:{type:String},password: {type:String, required:true},studentNumber: {type:String,unique:true},idNumber:{type:String,required:true,unique:true},
 DOB: {type:String, required:true},marital: {type:String, required:true},language: {type:String},gender: {type:String},email:{type:String,required:true,unique:true},
 mobile: {type:String, required:true},altmobile: {type:String,},province: {type:String},town: {type:String},Suburb:{type:String},addressCode:{type:String,required:true,}, 
 education: {type:String, required:true},eduYear: {type:String,},school: {type:String},Course: {type:String},idCopy:{type:String},certificateCopy:{type:String},parentID:{type:String},
 asp:{type:String},tertiary:{type:String},qLevel:{type:String},qName:{type:String}
})

//collection
const applicantModal = new mongoose.model('applicants', applicantSchema)

const adminSchema = new mongoose.Schema({
    username: {type:String},
    password: {type:String}
})
const adminModal = new mongoose.model('admins', adminSchema)

app.get('/',(req,res)=>{
    res.render('index')
})
app.get('/register',(req,res)=>{
    res.sendFile(__dirname +'/views/form.html')
})
app.post('/register', async (req, res) => {
    const {
        title, name, surname, password, idNumber, DOB, marital, language, gender, mobile, altmobile, email,
        province, town, Suburb, addressCode, education, eduYear, school, Course, idCopy, certificateCopy, parentID,
        asp, qLevel, qName, tertiary
    } = req.body;

    try {
        const studentNumber = studentNumberGenerator();
        const applicant = new applicantModal({
            title, name, surname, password, studentNumber, idNumber, DOB, marital, language, gender, mobile, altmobile, email,
            province, town, Suburb, addressCode, education, eduYear, school, Course, idCopy, certificateCopy, parentID,
            asp, qLevel, qName, tertiary
        });

        await applicantModal.insertMany([applicant]);

        // Send confirmation email
        const mailOptions = {
            from: `"Esgela Admissions - DONOTREPLY" <${process.env.EMAIL_USER}>`,
            to: applicant.email,
            subject: 'Application Confirmation - Submitted Successfully',
            html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #2E86C1;">Welcome to Esgela, ${applicant.name} ${applicant.surname}!</h2>

            <p>Thank you for registering with <strong>Esgela Coding Bootcamp</strong>. We're excited to have you begin your journey with us into the world of software development!</p>

            <p>Your application has been successfully received and is currently under review by our admissions team.</p>

            <h3 style="color: #117A65;">Your Registration Details:</h3>
            <ul>
                <li><strong>Full Name:</strong> ${applicant.title} ${applicant.name} ${applicant.surname}</li>
                <li><strong>Student Number:</strong> ${applicant.studentNumber}</li>
                <li><strong>Registered Course:</strong> ${applicant.Course}</li>
                <li><strong>Login Password:</strong> ${applicant.password}</li>
            </ul>

            <p><strong>⚠️ Please keep your Student Number and Password safe</strong> — you'll need them to log in and track your application or manage your account.</p>

            <p>✅ You will receive an approval email once your application has been reviewed.</p>

            <p>Alternatively, you can visit our website at <a href="https://www.esgela.com" target="_blank">www.esgela.com</a> to check your application status using your student number.</p>

            <hr style="margin: 20px 0;">
            <p style="font-size: 14px; color: #888;">This is an automated message from Esgela Admissions. Please do not reply to this email.</p>
            <p style="font-size: 14px; color: #888;">For assistance, contact us via our website or visit our campus support center.</p>

            <p>Best Regards,<br/>
            <strong>The Esgela Admissions Team</strong></p>
        </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Email failed to send:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });

        res.render('home', {
            name: applicant.name,
            studentNumber: applicant.studentNumber,
            idNumber: applicant.idNumber,
            asp: applicant.asp,
            education: applicant.education,
            Course: applicant.Course,
            surname: applicant.surname,
            title: applicant.title,
            certificateCopy: applicant.certificateCopy
        });

    } catch (err) {
        console.error(err);
        res.status(404).sendFile(__dirname + '/views/error.html');
    }
});
function studentNumberGenerator(){
    const prefix = '24';
    const number = '0123456789';
    let studentNumber = prefix;
    for (let i = 0; i <6; i++){
        const uniqueNumber = number.charAt(Math.floor(Math.random()* number.length));
        studentNumber += uniqueNumber;
    }
    return studentNumber;
}
app.get('/login',(req,res)=>{
    let error = ''
    res.render('login',{
       message:error 
    })
})

app.post('/login', async (req,res)=>{
    const {identifier, password}= req.body;
    try{
        const applicant = await applicantModal.findOne({
            $or: [{idNumber: identifier},{studentNumber:identifier}],
            password:password
        });
        if(applicant){
            res.render('home',{ 
                name: applicant.name, studentNumber: applicant.studentNumber,
                idNumber:applicant.idNumber,asp:applicant.asp,education:applicant.education,
                surname: applicant.surname,title:applicant.tile,certificateCopy:applicant.certificateCopy
            })
        }
        else{
            let error = 'User does not exist, Your Student Number (ID number) or Password might be incorrect!'
            res.render('login',{
                message:error
            })
        }
    } catch(err){
        res.status(404).res.sendFile(__dirname +'/views/error.html')
    }
})
app.get('/admin',(req,res)=>{
    let error = ''
    res.render('adminLogin',{
        message:error
    })
})
app.post('/admin', async (req, res) => {
    try {
        const checkadmin = await adminModal.findOne({ username: req.body.username });

        console.log("checkadmin:", checkadmin);
        let applicants = ''

        if (checkadmin) {
            console.log("Entered checkadmin block");
            console.log("checkadmin.password:", checkadmin.password);
            console.log("req.body.password:", req.body.password);

            if (checkadmin.password === req.body.password) {
                console.log("Passwords match");
                applicantModal.find()
                    .then(applicants => {
                        res.render('admin', {
                            applicants: applicants
                        });
                    });
            } else {
                console.log("Passwords don't match");
                let error = 'Admin details incorrect';
                res.render('adminLogin', {
                    message: error
                });
            }
        } else {
            console.log("Admin not found");
            let error = 'Admin details incorrect';
            res.render('adminLogin', {
                message: error
            });
        }
    } catch(err){
        res.status(404).sendFile(__dirname +'/views/error.html')
    }
});
  
app.use((req, res, next) => {
    res.status(404).sendFile(__dirname +'/views/error.html');
  });
app.listen(port,()=>{
    console.log(`Server connected to Port ${port}`)
})