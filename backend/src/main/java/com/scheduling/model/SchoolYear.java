package com.scheduling.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "school_years")
public class SchoolYear {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "School year name is required")
    @Column(unique = true)
    private String name; // e.g., "2024-2025"
    
    @NotNull(message = "Start date is required")
    private LocalDate startDate;
    
    @NotNull(message = "End date is required")
    private LocalDate endDate;
    
    @NotNull(message = "Is active flag is required")
    private Boolean isActive = false; // Only one school year can be active at a time
    
    private String description;
    
    // @OneToMany(mappedBy = "schoolYear", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    // private List<Schedule> schedules = new ArrayList<>();
    
    // Constructors
    public SchoolYear() {}
    
    public SchoolYear(String name, LocalDate startDate, LocalDate endDate, String description) {
        this.name = name;
        this.startDate = startDate;
        this.endDate = endDate;
        this.description = description;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public LocalDate getStartDate() {
        return startDate;
    }
    
    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }
    
    public LocalDate getEndDate() {
        return endDate;
    }
    
    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    // public List<Schedule> getSchedules() {
    //     return schedules;
    // }
    
    // public void setSchedules(List<Schedule> schedules) {
    //     this.schedules = schedules;
    // }
}
