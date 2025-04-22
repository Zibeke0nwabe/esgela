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
 mathsType: { type: String },mathsLevel: { type: String },scienceLevel: { type: String },tertiary:{type:String},qLevel:{type:String},qName:{type:String},status: { type: String, default: 'Pending' },

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
        mathsType, mathsLevel, scienceLevel, qLevel, qName, tertiary
    } = req.body;

    try {
        const studentNumber = studentNumberGenerator();
        const applicant = new applicantModal({
            title, name, surname, password, studentNumber, idNumber, DOB, marital, language, gender, mobile, altmobile, email,
            province, town, Suburb, addressCode, education, eduYear, school, Course, idCopy, certificateCopy, parentID,
            mathsType, mathsLevel, scienceLevel, qLevel, qName, tertiary
        });

        await applicantModal.insertMany([applicant]);

        // Send confirmation email
        const mailOptions = {
            from: `"Esgela Admissions - DONOTREPLY" <${process.env.EMAIL_USER}>`,
            to: applicant.email,
            subject: 'Application Confirmation - Submitted Successfully',
            html: `
    <div style="font-family: Arial, sans-serif; color: #333333; padding: 20px;">
        <p>Dear ${applicant.name} ${applicant.surname},</p>
    
        <h2 style="color: #ffbb00; font-size: 24px; font-weight: bold;">Welcome to Esgela, the Online Coding Bootcamp!</h2>
    
        <p style="font-size: 16px;">Thank you for submitting your application to <strong style="color: #000000;">Esgela Coding Bootcamp</strong>. We’re thrilled to see your interest in starting a journey into the world of software development!</p>
    
        <p style="font-size: 16px;">We’ve successfully received your application, and it is now under review by our admissions team.</p>
    
        <h3 style="color: #000000; font-size: 18px; margin-top: 30px;">📝 Your Application Details:</h3>
        <ol style="padding-left: 20px; font-size: 16px;">
            <li style="line-height: 1.8;"><strong>Full Name:</strong> ${applicant.name} ${applicant.surname}</li>
            <li style="line-height: 1.8;"><strong>Student Number:</strong> ${applicant.studentNumber}</li>
            <li style="line-height: 1.8;"><strong>Course Applied:</strong> ${applicant.Course}</li>
            <li style="line-height: 1.8;"><strong>Login Password:</strong> ${applicant.password}</li>
        </ol>
    
        <p style="background-color: #000000; padding: 12px; text-align: center; border-radius: 6px; color: #ffbb00; font-weight: bold;">
            ⚠️ Please keep your Student Number and Password safe — you'll need them to log in and track your application or manage your account.
        </p>
    
        <p style="font-size: 16px; margin-top: 20px;">✅ You will receive a follow-up email once your application has been reviewed and a decision has been made.</p>
    
        <p style="font-size: 16px;">
            You can check your application status anytime by visiting 
            <a href="https://www.esgela.onrender.com" target="_blank" style="color: #ffbb00; text-decoration: none;">
                www.esgela.com
            </a>. Log in using either your <strong>Student Number</strong> <em>or</em> <strong>ID Number</strong>, along with your <strong>Password</strong>.
        </p>
    
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ccc;">
    
        <p style="font-size: 14px; color: #777777;">📧 This is an automated message from Esgela Admissions. Please do not reply to this email.</p>
        <p style="font-size: 14px; color: #777777;">For assistance, contact us through our website or follow us on social media. We regularly post updates on all major platforms—stay connected!</p>
    
        <p style="margin-top: 30px;">Best regards,<br><br>
        <strong style="color: #000000;">The Esgela Admissions Team</strong></p>
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
        res.render('home', { applicant });

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

app.post('/login', async (req, res) => {
    const { identifier, password } = req.body;
    try {
        const applicant = await applicantModal.findOne({
            $or: [{ idNumber: identifier }, { studentNumber: identifier }],
            password: password
        });

        if (applicant) {
            res.render('home', { applicant });
        } else {
            let error = 'User does not exist, Your Student Number (ID number) or Password might be incorrect!';
            res.render('login', { message: error });
        }
    } catch (err) {
        res.status(404).sendFile(__dirname + '/views/error.html');
    }
});

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
app.post('/admin/decision', async (req, res) => {
    const { id, decision } = req.body;


    try {
        const applicant = await applicantModal.findById(id);
        if (!applicant) return res.status(404).json({ message: 'Applicant not found' });
        applicant.status = decision === 'accept' ? 'Accepted' : 'Rejected';
        await applicant.save();
        // Send acceptance or rejection email
        const subject = decision === 'accept' 
            ? '🎉 Congratulations! You’ve Been Accepted to Esgela'
            : '❌ Application Update – Esgela Coding Bootcamp';
        
        const htmlContent = decision === 'accept' 
            ? `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #28a745;">🎉 Congratulations, ${applicant.name}!</h2>
                    <p>Your application to <strong>Esgela Coding Bootcamp</strong> has been <strong>accepted</strong>! 🎓</p>
                    <p>Get ready to unlock your future in software development.</p>
                    <p style="margin-top: 20px;">Login using your student number or ID and your password to get started.</p>
                    <p style="margin-top: 30px;">See you on the platform!<br><br><strong style="color: #000;">The Esgela Admissions Team</strong></p>
                </div>`
            : `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #e74c3c;">Dear ${applicant.name},</h2>
                    <p>Thank you for your interest in <strong>Esgela Coding Bootcamp</strong>.</p>
                    <p>After careful review, we regret to inform you that your application was not successful at this time.</p>
                    <p>We encourage you to continue learning and feel free to apply again in the future.</p>
                    <p style="margin-top: 30px;">Warm regards,<br><br><strong style="color: #000;">The Esgela Admissions Team</strong></p>
                </div>`;

        await transporter.sendMail({
            from: `"Esgela Admissions" <${process.env.EMAIL_USER}>`,
            to: applicant.email,
            subject,
            html: htmlContent
        });

        return res.json({ message: `Application ${decision}ed and email sent.` });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
});

app.use((req, res, next) => {
    res.status(404).sendFile(__dirname +'/views/error.html');
  });
app.listen(port,()=>{
    console.log(`Server connected to Port ${port}`)
})