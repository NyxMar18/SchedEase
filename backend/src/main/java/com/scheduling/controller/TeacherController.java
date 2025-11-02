package com.scheduling.controller;

import com.scheduling.model.Teacher;
import com.scheduling.repository.TeacherRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/teachers")
@CrossOrigin(origins = "http://localhost:3000")
public class TeacherController {
    
    @Autowired
    private TeacherRepository teacherRepository;
    
    @GetMapping
    public ResponseEntity<List<Teacher>> getAllTeachers() {
        List<Teacher> teachers = teacherRepository.findAll();
        return ResponseEntity.ok(teachers);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Teacher> getTeacherById(@PathVariable Long id) {
        Optional<Teacher> teacher = teacherRepository.findById(id);
        return teacher.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<Teacher> createTeacher(@Valid @RequestBody Teacher teacher) {
        try {
            Teacher savedTeacher = teacherRepository.save(teacher);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedTeacher);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Teacher> updateTeacher(@PathVariable Long id, @Valid @RequestBody Teacher teacherDetails) {
        Optional<Teacher> optionalTeacher = teacherRepository.findById(id);
        
        if (optionalTeacher.isPresent()) {
            Teacher teacher = optionalTeacher.get();
            teacher.setFirstName(teacherDetails.getFirstName());
            teacher.setLastName(teacherDetails.getLastName());
            teacher.setEmail(teacherDetails.getEmail());
            teacher.setSubjects(teacherDetails.getSubjects());
            teacher.setAvailableStartTime(teacherDetails.getAvailableStartTime());
            teacher.setAvailableEndTime(teacherDetails.getAvailableEndTime());
            teacher.setAvailableDays(teacherDetails.getAvailableDays());
            teacher.setPhoneNumber(teacherDetails.getPhoneNumber());
            teacher.setNotes(teacherDetails.getNotes());
            
            Teacher updatedTeacher = teacherRepository.save(teacher);
            return ResponseEntity.ok(updatedTeacher);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTeacher(@PathVariable Long id) {
        if (teacherRepository.existsById(id)) {
            teacherRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/subject/{subject}")
    public ResponseEntity<List<Teacher>> getTeachersBySubject(@PathVariable String subject) {
        List<Teacher> teachers = teacherRepository.findBySubject(subject);
        return ResponseEntity.ok(teachers);
    }
    
    @GetMapping("/available")
    public ResponseEntity<List<Teacher>> getAvailableTeachers(
            @RequestParam String subject,
            @RequestParam String day,
            @RequestParam String startTime,
            @RequestParam String endTime) {
        
        List<Teacher> teachers = teacherRepository.findAvailableTeachers(
            subject,
            com.scheduling.model.DayOfWeek.valueOf(day.toUpperCase()),
            java.time.LocalTime.parse(startTime),
            java.time.LocalTime.parse(endTime)
        );
        return ResponseEntity.ok(teachers);
    }
}
