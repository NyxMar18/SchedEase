package com.scheduling.controller;

import com.scheduling.model.SchoolYear;
import com.scheduling.repository.SchoolYearRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/school-years")
@CrossOrigin(origins = "*")
public class SchoolYearController {
    
    @Autowired
    private SchoolYearRepository schoolYearRepository;
    
    @GetMapping
    public ResponseEntity<List<SchoolYear>> getAllSchoolYears() {
        List<SchoolYear> schoolYears = schoolYearRepository.findAllByOrderByNameDesc();
        return ResponseEntity.ok(schoolYears);
    }
    
    @GetMapping("/active")
    public ResponseEntity<SchoolYear> getActiveSchoolYear() {
        Optional<SchoolYear> activeSchoolYear = schoolYearRepository.findActiveSchoolYear();
        return activeSchoolYear.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<SchoolYear> getSchoolYearById(@PathVariable Long id) {
        Optional<SchoolYear> schoolYear = schoolYearRepository.findById(id);
        return schoolYear.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<SchoolYear> createSchoolYear(@Valid @RequestBody SchoolYear schoolYear) {
        // Check if name already exists
        if (schoolYearRepository.existsByName(schoolYear.getName())) {
            return ResponseEntity.badRequest().build();
        }
        
        // If this is set as active, deactivate all others
        if (schoolYear.getIsActive()) {
            schoolYearRepository.findAll().forEach(sy -> {
                sy.setIsActive(false);
                schoolYearRepository.save(sy);
            });
        }
        
        SchoolYear savedSchoolYear = schoolYearRepository.save(schoolYear);
        return ResponseEntity.ok(savedSchoolYear);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<SchoolYear> updateSchoolYear(@PathVariable Long id, @Valid @RequestBody SchoolYear schoolYearDetails) {
        Optional<SchoolYear> schoolYearOptional = schoolYearRepository.findById(id);
        if (!schoolYearOptional.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        SchoolYear schoolYear = schoolYearOptional.get();
        
        // Check if name already exists (excluding current record)
        if (!schoolYear.getName().equals(schoolYearDetails.getName()) && 
            schoolYearRepository.existsByName(schoolYearDetails.getName())) {
            return ResponseEntity.badRequest().build();
        }
        
        // If this is set as active, deactivate all others
        if (schoolYearDetails.getIsActive() && !schoolYear.getIsActive()) {
            schoolYearRepository.findAll().forEach(sy -> {
                sy.setIsActive(false);
                schoolYearRepository.save(sy);
            });
        }
        
        schoolYear.setName(schoolYearDetails.getName());
        schoolYear.setStartDate(schoolYearDetails.getStartDate());
        schoolYear.setEndDate(schoolYearDetails.getEndDate());
        schoolYear.setDescription(schoolYearDetails.getDescription());
        schoolYear.setIsActive(schoolYearDetails.getIsActive());
        
        SchoolYear updatedSchoolYear = schoolYearRepository.save(schoolYear);
        return ResponseEntity.ok(updatedSchoolYear);
    }
    
    @PutMapping("/{id}/activate")
    public ResponseEntity<SchoolYear> activateSchoolYear(@PathVariable Long id) {
        Optional<SchoolYear> schoolYearOptional = schoolYearRepository.findById(id);
        if (!schoolYearOptional.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        // Deactivate all school years
        schoolYearRepository.findAll().forEach(sy -> {
            sy.setIsActive(false);
            schoolYearRepository.save(sy);
        });
        
        // Activate the selected one
        SchoolYear schoolYear = schoolYearOptional.get();
        schoolYear.setIsActive(true);
        SchoolYear updatedSchoolYear = schoolYearRepository.save(schoolYear);
        
        return ResponseEntity.ok(updatedSchoolYear);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchoolYear(@PathVariable Long id) {
        Optional<SchoolYear> schoolYear = schoolYearRepository.findById(id);
        if (!schoolYear.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        // Check if school year has schedules
        // if (!schoolYear.get().getSchedules().isEmpty()) {
        //     return ResponseEntity.badRequest().build(); // Cannot delete school year with schedules
        // }
        
        schoolYearRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
