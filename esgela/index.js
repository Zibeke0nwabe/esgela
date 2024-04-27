const express= require('express');
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
// seting ejs
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
app.post('/register', async (req,res)=>{
    const {title,name,surname,password,idNumber,DOB,marital,language,gender,mobile,altmobile,email,
    province,town,Suburb,addressCode,education,eduYear,school,Course,idCopy,certificateCopy,parentID,
    asp,qLevel,qName,tertiary
    } = req.body;
    try{
        const studentNumber = studentNumberGenerator();
        const applicant = new applicantModal ({
            title,name,surname, password,studentNumber,idNumber,DOB,marital,language,gender,mobile,altmobile,email,
            province,town,Suburb,addressCode,education,eduYear,school,Course,idCopy,certificateCopy,parentID
            ,asp,qLevel,qName,tertiary
        })
        await applicantModal.insertMany([applicant])
        res.render('home',{ 
            name: applicant.name, studentNumber: applicant.studentNumber,
             idNumber:applicant.idNumber,asp:applicant.asp,education:applicant.education,
            Course: applicant.Course,surname: applicant.surname,title:applicant.title,certificateCopy: applicant.certificateCopy
        })
    } catch(err){
        console.log(err)
    }
})
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
        console.log(err)
    }
})
app.get('/admin',(req,res)=>{
    let error = ''
    res.render('adminLogin',{
        message:error
    })
})
app.post('/admin',async (req,res)=>{
    try {

        const checkadmin = await adminModal.findOne({username:req.body.username})

        if(checkadmin.password===req.body.password){
            applicantModal.find()
            .then(applicants => {
                res.render('admin', {
                    applicantsList: applicants
                });
            })
        }else{
            let error = 'Admin details incorrect'
            res.render('adminLogin',{
                message:error
            })
            
        }
        
    }catch(err){
        res.send(err)
    }
    
})

app.get('/adminInfo', (req, res) => {

    applicantModal.find()
        .then(applicants => {
            res.render('admin', {
                applicantsList: applicants
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
});
app.listen(port,()=>{
    console.log(`Server connected to Port ${port}`)
})