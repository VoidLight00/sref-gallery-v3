# Image Acquisition Strategy for Real SREF Codes

## Overview
This strategy outlines how to acquire authentic example images for the verified Midjourney SREF codes collected in our research.

## 1. Image Generation Approach

### Systematic Generation Process
For each verified SREF code, generate 4 example images using standardized prompts:

#### Base Prompts for Testing
1. **Universal Test**: `"beautiful portrait of a person --sref [CODE]"`
2. **Landscape Test**: `"serene mountain landscape --sref [CODE]"`  
3. **Object Test**: `"elegant coffee cup on wooden table --sref [CODE]"`
4. **Abstract Test**: `"flowing abstract composition --sref [CODE]"`

#### Category-Specific Prompts
- **Anime Codes**: `"anime character in magical forest --sref [CODE] --niji"`
- **Photography Codes**: `"professional headshot portrait --sref [CODE]"`
- **Art Codes**: `"still life painting with flowers --sref [CODE]"`
- **Digital Art Codes**: `"futuristic cityscape --sref [CODE]"`

## 2. Community-Sourced Images

### Preferred Sources
1. **Official SREF Databases**: midjourneysref.com, sref-midjourney.com
2. **Community Platforms**: Reddit r/midjourney, Discord communities
3. **Creator Portfolios**: Individual artist collections
4. **Educational Resources**: Tutorial and guide examples

### Attribution Standards
```markdown
Image Credit: [Creator Name] via [Platform]
SREF Code: [10-digit code]
Original Prompt: "[prompt used]"
License: Community Use / Creative Commons / With Permission
```

## 3. Technical Specifications

### Image Requirements
- **Format**: WebP (optimized for web)
- **Dimensions**: 512x512px (square aspect ratio)
- **Quality**: 85% compression for balance of quality/file size
- **File Naming**: `sref-[CODE]-[1-4].webp`

### Processing Pipeline
1. **Collection**: Source high-quality examples (1024x1024 or higher)
2. **Processing**: Resize to 512x512, convert to WebP
3. **Optimization**: Compress while maintaining visual quality
4. **Validation**: Ensure images accurately represent the SREF style
5. **Organization**: Store in category-based folder structure

## 4. Folder Structure

```
/public/images/sref/
├── anime/
│   ├── sref-505167129-1.webp
│   ├── sref-505167129-2.webp
│   ├── sref-505167129-3.webp
│   └── sref-505167129-4.webp
├── photography/
│   ├── sref-3747634208-1.webp
│   ├── sref-3747634208-2.webp
│   ├── sref-3747634208-3.webp
│   └── sref-3747634208-4.webp
├── illustration/
├── traditional-art/
├── digital-art/
├── color-themed/
├── line-art/
└── surreal/
```

## 5. Generation Scripts

### Automated Generation Commands
Create batch scripts for systematic SREF testing:

```bash
# High-priority SREF codes for immediate generation
PRIORITY_CODES=(
  "505167129"  # Studio Ghibli
  "3747634208" # Film Photography  
  "2940727885" # Illustration
  "680572301"  # Most Popular 2024
  "1018232447" # Children's Book
)

# Generate test images for each code
for code in "${PRIORITY_CODES[@]}"; do
  echo "Generating examples for SREF $code"
  # Run Midjourney generation with standardized prompts
done
```

### Prompt Templates
```json
{
  "universal": "beautiful portrait --sref {code} --ar 1:1",
  "landscape": "serene landscape --sref {code} --ar 1:1", 
  "object": "elegant still life --sref {code} --ar 1:1",
  "abstract": "flowing composition --sref {code} --ar 1:1"
}
```

## 6. Quality Control Process

### Image Selection Criteria
1. **Style Representation**: Clearly demonstrates the SREF's unique characteristics
2. **Technical Quality**: Sharp, well-composed, good lighting
3. **Diversity**: Shows SREF application across different subjects
4. **Authenticity**: Generated using the actual SREF code

### Curation Process
1. **Generate 8-12 candidates** per SREF code
2. **Select best 4 examples** based on criteria above
3. **Get community feedback** on selections
4. **Iterate based on user preferences**

## 7. Copyright and Legal Compliance

### Community Guidelines
- Prioritize community-generated content
- Provide proper attribution
- Respect creator preferences
- Implement takedown procedures

### Legal Framework
- Fair use for educational/research purposes
- Community contribution model
- Creative Commons licensing preferred
- Clear usage terms and conditions

## 8. Implementation Timeline

### Phase 1: High-Priority Codes (Week 1-2)
- Generate images for top 10 most popular SREF codes
- Focus on anime, photography, and illustration categories
- Establish quality standards and workflows

### Phase 2: Category Expansion (Week 3-4)
- Complete remaining verified codes
- Add traditional art and digital art examples
- Implement automated processing pipeline

### Phase 3: Community Integration (Week 5-6)  
- Launch community submission system
- Add user-generated examples
- Implement feedback and rating system

## 9. Performance Optimization

### Image Loading Strategy
- Implement lazy loading for better performance
- Use responsive images with multiple sizes
- Add WebP fallbacks for browser compatibility
- Implement image caching strategy

### CDN Integration
- Use Vercel's built-in image optimization
- Configure proper caching headers
- Implement progressive loading
- Add blur-up loading placeholders

## 10. Monitoring and Updates

### Quality Metrics
- Track image load performance
- Monitor user engagement with examples
- Collect feedback on style representation
- Measure conversion from examples to usage

### Regular Maintenance
- **Weekly**: Add new SREF examples
- **Monthly**: Review and update existing images  
- **Quarterly**: Audit for copyright compliance
- **Annually**: Major quality and strategy review

---

*Implementation Priority: Immediate*
*Target Completion: 2-3 weeks*
*Quality Standard: 95% accurate style representation*