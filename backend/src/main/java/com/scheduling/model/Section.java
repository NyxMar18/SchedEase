package com.scheduling.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "sections")
public class Section {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Section name is required")
    @Column(unique = true)
    private String sectionName;
    
    @NotBlank(message = "Grade level is required")
    private String gradeLevel;
    
    @NotNull(message = "Student count is required")
    @Positive(message = "Student count must be positive")
    private Integer studentCount;
    
    @ElementCollection
    @Enumerated(EnumType.STRING)
    private Set<DayOfWeek> availableDays = new HashSet<>();
    
    @Enumerated(EnumType.STRING)
    private SchedulePattern schedulePattern = SchedulePattern.MWF;
    
    private String description;
    
    // Constructors
    public Section() {}
    
    public Section(String sectionName, String gradeLevel, Integer studentCount, Set<DayOfWeek> availableDays) {
        this.sectionName = sectionName;
        this.gradeLevel = gradeLevel;
        this.studentCount = studentCount;
        this.availableDays = availableDays != null ? availableDays : new HashSet<>();
    }
    
    public Section(String sectionName, String gradeLevel, Integer studentCount, Set<DayOfWeek> availableDays, SchedulePattern schedulePattern) {
        this.sectionName = sectionName;
        this.gradeLevel = gradeLevel;
        this.studentCount = studentCount;
        this.availableDays = availableDays != null ? availableDays : new HashSet<>();
        this.schedulePattern = schedulePattern != null ? schedulePattern : SchedulePattern.MWF;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getSectionName() {
        return sectionName;
    }
    
    public void setSectionName(String sectionName) {
        this.sectionName = sectionName;
    }
    
    public String getGradeLevel() {
        return gradeLevel;
    }
    
    public void setGradeLevel(String gradeLevel) {
        this.gradeLevel = gradeLevel;
    }
    
    public Integer getStudentCount() {
        return studentCount;
    }
    
    public void setStudentCount(Integer studentCount) {
        this.studentCount = studentCount;
    }
    
    public Set<DayOfWeek> getAvailableDays() {
        return availableDays;
    }
    
    public void setAvailableDays(Set<DayOfWeek> availableDays) {
        this.availableDays = availableDays != null ? availableDays : new HashSet<>();
    }
    
    public SchedulePattern getSchedulePattern() {
        return schedulePattern;
    }
    
    public void setSchedulePattern(SchedulePattern schedulePattern) {
        this.schedulePattern = schedulePattern != null ? schedulePattern : SchedulePattern.MWF;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
}

