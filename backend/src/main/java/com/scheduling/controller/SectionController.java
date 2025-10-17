package com.scheduling.controller;

import com.scheduling.model.Section;
import com.scheduling.repository.SectionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/sections")
@CrossOrigin(origins = "*")
public class SectionController {
    
    @Autowired
    private SectionRepository sectionRepository;
    
    @GetMapping
    public List<Section> getAllSections() {
        return sectionRepository.findAll();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Section> getSection(@PathVariable Long id) {
        Optional<Section> section = sectionRepository.findById(id);
        return section.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public Section createSection(@RequestBody Section section) {
        return sectionRepository.save(section);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Section> updateSection(@PathVariable Long id, @RequestBody Section sectionDetails) {
        Optional<Section> section = sectionRepository.findById(id);
        if (section.isPresent()) {
            Section updatedSection = section.get();
            updatedSection.setSectionName(sectionDetails.getSectionName());
            updatedSection.setGradeLevel(sectionDetails.getGradeLevel());
            updatedSection.setStudentCount(sectionDetails.getStudentCount());
            updatedSection.setAvailableDays(sectionDetails.getAvailableDays());
            updatedSection.setDescription(sectionDetails.getDescription());
            
            Section savedSection = sectionRepository.save(updatedSection);
            return ResponseEntity.ok(savedSection);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSection(@PathVariable Long id) {
        if (sectionRepository.existsById(id)) {
            sectionRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}

