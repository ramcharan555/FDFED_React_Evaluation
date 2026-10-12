CREATE DATABASE Event_Management;
USE Event_Management;
CREATE TABLE Users(
  User_ID INT PRIMARY KEY,
  User_Role VARCHAR(15) NOT NULL,
  Name VARCHAR(100) NOT NULL,
  Email VARCHAR(100) UNIQUE NOT NULL,
  Phone_No VARCHAR(15),
  Status VARCHAR(15) NOT NULL,
  Address VARCHAR(255)
  );
CREATE TABLE Super_User(
SuperUser_ID INT PRIMARY KEY,
Password VARCHAR(100) NOT NULL,
User_ID INT NOT NULL,
FOREIGN KEY(User_ID) REFERENCES Users(User_ID),
  );

CREATE TABLE Client(
Client_ID INT PRIMARY KEY,
User_ID INT NOT NULL,
Password VARCHAR(100) NOT NULL,
FOREIGN KEY(User_ID) REFERENCES Users(User_ID),
);

CREATE TABLE Event_Organizer(
Organizer_ID INT PRIMARY KEY,
User_ID INT NOT NULL,
Password VARCHAR(100) NOT NULL,
FOREIGN KEY(User_ID) REFERENCES Users(User_ID),
);

CREATE TABLE Event(
Event_ID INT PRIMARY KEY,
Organizer_ID INT NOT NULL,
Client_ID INT NOT NULL,
SuperUser_ID INT NOT NULL,
Name VARCHAR(200) NOT NULL,
Event_Type VARCHAR(100),
Date DATE NOT NULL,
Location VARCHAR(200) NOT NULL,
Capacity INT,
Status VARCHAR(50),
FOREIGN KEY(SuperUser_ID) REFERENCES Super_User(SuperUser_ID),
FOREIGN KEY(Organizer_ID) REFERENCES Event_Organizer(Organizer_ID),
FOREIGN KEY(Client_ID) REFERENCES Client(Client_ID)
);

CREATE TABLE Event_Plan(
EventPlan_ID INT PRIMARY KEY,
Event_ID INT NOT NULL,
Client_ID INT NOT NULL,
Organizer_ID INT NOT NULL,
Status VARCHAR(50),
Approval_Status VARCHAR(50),
FOREIGN KEY(Event_ID) REFERENCES Event(Event_ID),
FOREIGN KEY(Client_ID) REFERENCES Client(Client_ID),
FOREIGN KEY(Organizer_ID) REFERENCES Event_Organizer(Organizer_ID)
);

CREATE TABLE Event_Report(
EventReport_ID INT PRIMARY KEY,
Organizer_ID INT NOT NULL,
Event_ID INT NOT NULL,
Client_ID INT NOT NULL,
Submission_Date DATE NOT NULL,
FOREIGN KEY(Organizer_ID) REFERENCES Event_Organizer(Organizer_ID),
FOREIGN KEY(Event_ID) REFERENCES Event(Event_ID),
FOREIGN KEY(Client_ID) REFERENCES Client(Client_ID)
);

CREATE TABLE Attendee(
Attendee_ID INT PRIMARY KEY,
User_ID INT NOT NULL,
Password VARCHAR(100) NOT NULL,
FOREIGN KEY(User_ID) REFERENCES Users(User_ID)
);

CREATE TABLE Registration(
Registration_ID INT PRIMARY KEY,
Attendee_ID INT NOT NULL,
Event_ID INT NOT NULL,
Registration_Date DATE NOT NULL,
Status VARCHAR(50),
Additional_Info VARCHAR(255),
Ticket_Type VARCHAR(50),
FOREIGN KEY(Attendee_ID) REFERENCES Attendee(Attendee_ID),
FOREIGN KEY(Event_ID) REFERENCES Event(Event_ID)
);

CREATE TABLE Payment(
Payment_ID INT PRIMARY KEY,
Registration_ID INT NOT NULL,
Amount DECIMAL(10,2) NOT NULL,
Status VARCHAR(50),
Payment_Date DATE NOT NULL,
Payment_Method VARCHAR(50),
FOREIGN KEY(Registration_ID) REFERENCES Registration(Registration_ID)
);

CREATE TABLE Staff(
Staff_ID INT PRIMARY KEY,
User_ID INT NOT NULL,
Rating FLOAT,
Available_Dates VARCHAR(255),
FOREIGN KEY(User_ID) REFERENCES Users(User_ID),
);

CREATE TABLE Event_Staff(
Event_ID INT NOT NULL,
Organizer_ID INT NOT NULL,
Staff_ID INT NOT NULL,
Status VARCHAR(50),
PRIMARY KEY(Event_ID,Staff_ID),
FOREIGN KEY(Event_ID) REFERENCES Event(Event_ID),
FOREIGN KEY(Organizer_ID) REFERENCES Event_Organizer(Organizer_ID),
FOREIGN KEY(Staff_ID) REFERENCES Staff(Staff_ID)
);

CREATE TABLE Attendance(
Attendance_ID INT PRIMARY KEY,
Attendee_ID INT NOT NULL,
Event_ID INT NOT NULL,
Staff_ID INT NOT NULL,
CheckInTime DATETIME,
Status VARCHAR(50),
FOREIGN KEY(Attendee_ID) REFERENCES Attendee(Attendee_ID),
FOREIGN KEY(Event_ID) REFERENCES Event(Event_ID),
FOREIGN KEY(Staff_ID) REFERENCES Staff(Staff_ID)
);

CREATE TABLE Notification(
Notification_ID INT PRIMARY KEY,
Registration_ID INT,
Attendee_ID INT,
Payment_ID INT,
Message VARCHAR(255),
Date_Time DATETIME,
FOREIGN KEY(Registration_ID) REFERENCES Registration(Registration_ID),
FOREIGN KEY(Attendee_ID) REFERENCES Attendee(Attendee_ID),
FOREIGN KEY(Payment_ID) REFERENCES Payment(Payment_ID)
);

CREATE TABLE Event_Review(
Attendee_ID INT NOT NULL,
Event_ID INT NOT NULL,
Client_ID INT NOT NULL,
Rating INT,
Comment VARCHAR(255),
Date DATE,
PRIMARY KEY(Attendee_ID,Event_ID),
FOREIGN KEY(Attendee_ID) REFERENCES Attendee(Attendee_ID),
FOREIGN KEY(Event_ID) REFERENCES Event(Event_ID),
FOREIGN KEY(Client_ID) REFERENCES Client(Client_ID)
);

CREATE TABLE StaffReview(
Organizer_ID INT NOT NULL,
Staff_ID INT NOT NULL,
Event_ID INT NOT NULL,
Rating FLOAT,
Comment VARCHAR(255),
ReviewDate DATE,
PRIMARY KEY(Organizer_ID,Staff_ID,Event_ID),
FOREIGN KEY(Organizer_ID) REFERENCES Event_Organizer(Organizer_ID),
FOREIGN KEY(Staff_ID) REFERENCES Staff(Staff_ID),
FOREIGN KEY(Event_ID) REFERENCES Event(Event_ID)
);
