package com.scheduling.controller;

import com.scheduling.model.Subject;
import com.scheduling.repository.SubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/subjects")
@CrossOrigin(origins = "*")
public class SubjectController {
    
    @Autowired
    private SubjectRepository subjectRepository;
    
    @GetMapping
    public List<Subject> getAllSubjects() {
        return subjectRepository.findAllOrderByPriority();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Subject> getSubject(@PathVariable Long id) {
        Optional<Subject> subject = subjectRepository.findById(id);
        return subject.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public Subject createSubject(@RequestBody Subject subject) {
        return subjectRepository.save(subject);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Subject> updateSubject(@PathVariable Long id, @RequestBody Subject subjectDetails) {
        Optional<Subject> subject = subjectRepository.findById(id);
        if (subject.isPresent()) {
            Subject updatedSubject = subject.get();
            updatedSubject.setName(subjectDetails.getName());
            updatedSubject.setCode(subjectDetails.getCode());
            updatedSubject.setDurationPerWeek(subjectDetails.getDurationPerWeek());
            updatedSubject.setRequiredRoomType(subjectDetails.getRequiredRoomType());
            updatedSubject.setPriority(subjectDetails.getPriority());
            updatedSubject.setDescription(subjectDetails.getDescription());
            
            Subject savedSubject = subjectRepository.save(updatedSubject);
            return ResponseEntity.ok(savedSubject);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSubject(@PathVariable Long id) {
        if (subjectRepository.existsById(id)) {
            subjectRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}

